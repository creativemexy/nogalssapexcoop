'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ParentOrganization {
  id: string;
  name: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  website?: string;
  logo?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: ParentOrganization;
  children: ParentOrganization[];
  cooperatives: Array<{
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    address: string;
    isActive: boolean;
    createdAt: string;
  }>;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface DashboardStats {
  totalCooperatives: number;
  activeCooperatives: number;
  totalTransactions: number;
  totalContributions: number;
  totalLoans: number;
  pendingLoans: number;
  // Allocation data
  totalRegistrationFees: number;
  parentOrganizationAllocation: number;
  allocationPercentage: number;
  allocationSettings: {
    cooperativeShare: number;
    leaderShare: number;
    parentOrganizationShare: number;
  };
}

export default function ParentOrganizationDashboard() {
  const { data: session } = useSession();
  const [organization, setOrganization] = useState<ParentOrganization | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchWithdrawalData = async () => {
      try {
        const response = await fetch('/api/parent-organization/withdraw');
        if (response.ok) {
          const data = await response.json();
          setAvailableBalance(data.availableBalance);
          setWithdrawalHistory(data.withdrawals || []);
        }
      } catch (err) {
        console.error('Error fetching withdrawal data:', err);
      }
    };

    fetchOrganizationData();
    fetchWithdrawalData();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (availableBalance === null || parseFloat(withdrawAmount) > availableBalance) {
      alert(`Insufficient balance. Available balance: ₦${availableBalance?.toLocaleString() || '0'}`);
      return;
    }

    if (!withdrawReason.trim()) {
      alert('Please provide a reason for withdrawal');
      return;
    }

    setIsSubmittingWithdrawal(true);

    try {
      const response = await fetch('/api/parent-organization/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          reason: withdrawReason.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Withdrawal request submitted successfully! You will be notified when it is processed.');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawReason('');
        // Refresh withdrawal data
        const refreshResponse = await fetch('/api/parent-organization/withdraw');
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setAvailableBalance(refreshData.availableBalance);
          setWithdrawalHistory(refreshData.withdrawals || []);
        }
      } else {
        alert(data.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch organization details
      const orgResponse = await fetch('/api/parent-organization/profile');
      if (!orgResponse.ok) throw new Error('Failed to fetch organization data');
      const orgData = await orgResponse.json();
      setOrganization(orgData);

      // Fetch dashboard stats
      const statsResponse = await fetch('/api/parent-organization/dashboard-stats');
      if (!statsResponse.ok) throw new Error('Failed to fetch dashboard stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 font-semibold mb-4">{error}</div>
          <button
            onClick={fetchOrganizationData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {organization?.name} Dashboard
        </h1>
        {organization?.description && (
          <p className="text-gray-600">{organization.description}</p>
        )}
      </div>

      {/* Organization Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Organization Information</h2>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Withdraw Allocation
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Contact Email</p>
            <p className="text-gray-900">{organization?.contactEmail}</p>
          </div>
          {organization?.contactPhone && (
            <div>
              <p className="text-sm font-medium text-gray-500">Contact Phone</p>
              <p className="text-gray-900">{organization.contactPhone}</p>
            </div>
          )}
          {organization?.address && (
            <div>
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="text-gray-900">{organization.address}</p>
            </div>
          )}
          {organization?.website && (
            <div>
              <p className="text-sm font-medium text-gray-500">Website</p>
              <a 
                href={organization.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {organization.website}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Cooperatives" 
          value={stats?.totalCooperatives || 0} 
          color="blue" 
        />
        <StatCard 
          title="Active Cooperatives" 
          value={stats?.activeCooperatives || 0} 
          color="green" 
        />
        <StatCard 
          title="Total Transactions" 
          value={stats?.totalTransactions || 0} 
          color="purple" 
        />
        <StatCard 
          title="Total Contributions" 
          value={stats?.totalContributions || 0} 
          color="green" 
          isCurrency 
        />
        <StatCard 
          title="Total Loans" 
          value={stats?.totalLoans || 0} 
          color="yellow" 
          isCurrency 
        />
        <StatCard 
          title="Pending Loans" 
          value={stats?.pendingLoans || 0} 
          color="red" 
        />
        <StatCard 
          title="Registration Fees" 
          value={stats?.totalRegistrationFees || 0} 
          color="blue" 
          isCurrency 
        />
        <StatCard 
          title="Allocation Share" 
          value={stats?.parentOrganizationAllocation || 0} 
          color="purple" 
          isCurrency 
        />
        <StatCard 
          title="Allocation %" 
          value={stats?.allocationPercentage || 0} 
          color="green" 
          isPercentage
        />
      </div>

      {/* Allocation Share Section */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Fee Allocation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">₦{stats.totalRegistrationFees?.toLocaleString() || '0'}</div>
              <div className="text-sm text-gray-500">Total Registration Fees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">₦{stats.parentOrganizationAllocation?.toLocaleString() || '0'}</div>
              <div className="text-sm text-gray-500">Your Allocation Share</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">{stats.allocationPercentage || 0}%</div>
              <div className="text-sm text-gray-500">Allocation Percentage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ₦{((stats.totalRegistrationFees || 0) - (stats.parentOrganizationAllocation || 0)).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Remaining Distribution</div>
            </div>
          </div>
          
          {/* Allocation Breakdown */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-3">Allocation Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-800">Cooperative Share</div>
                <div className="text-lg font-bold text-blue-600">{stats.allocationSettings?.cooperativeShare || 0}%</div>
                <div className="text-xs text-blue-500">
                  ₦{((stats.totalRegistrationFees || 0) * (stats.allocationSettings?.cooperativeShare || 0) / 100).toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm font-medium text-green-800">Leader Share</div>
                <div className="text-lg font-bold text-green-600">{stats.allocationSettings?.leaderShare || 0}%</div>
                <div className="text-xs text-green-500">
                  ₦{((stats.totalRegistrationFees || 0) * (stats.allocationSettings?.leaderShare || 0) / 100).toLocaleString()}
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm font-medium text-orange-800">Parent Organization Share</div>
                <div className="text-lg font-bold text-orange-600">{stats.allocationSettings?.parentOrganizationShare || 0}%</div>
                <div className="text-xs text-orange-500">
                  ₦{((stats.totalRegistrationFees || 0) * (stats.allocationSettings?.parentOrganizationShare || 0) / 100).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <ActionCard 
          title="Manage Cooperatives" 
          description="View and manage associated cooperatives" 
          href="/dashboard/parent-organization/cooperatives" 
        />
        <ActionCard 
          title="View All Members" 
          description="View members from all cooperatives" 
          href="/dashboard/parent-organization/members" 
        />
        <ActionCard 
          title="View Reports" 
          description="Generate and view organization reports" 
          href="/dashboard/parent-organization/reports" 
        />
        <ActionCard 
          title="Account Settings" 
          description="Update organization information" 
          href="/dashboard/parent-organization/settings" 
        />
        <ActionCard 
          title="Change Password" 
          description="Update your login password" 
          href="/dashboard/parent-organization/change-password" 
        />
        <ActionCard 
          title="View Transactions" 
          description="Monitor all transactions" 
          href="/dashboard/parent-organization/transactions" 
        />
        <ActionCard 
          title="Support" 
          description="Get help and support" 
          href="/dashboard/parent-organization/support" 
        />
      </div>

      {/* Recent Cooperatives */}
      {organization?.cooperatives && organization.cooperatives.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Associated Cooperatives</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-600">Name</th>
                  <th className="text-left py-2 text-gray-600">Email</th>
                  <th className="text-left py-2 text-gray-600">Phone</th>
                  <th className="text-left py-2 text-gray-600">Status</th>
                  <th className="text-left py-2 text-gray-600">Joined</th>
                </tr>
              </thead>
              <tbody>
                {organization.cooperatives.slice(0, 5).map((cooperative) => (
                  <tr key={cooperative.id} className="border-b border-gray-100">
                    <td className="py-2 text-gray-900">{cooperative.name}</td>
                    <td className="py-2 text-gray-900">{cooperative.email}</td>
                    <td className="py-2 text-gray-900">{cooperative.phoneNumber}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        cooperative.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cooperative.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500">
                      {new Date(cooperative.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {organization.cooperatives.length > 5 && (
            <div className="mt-4 text-center">
              <Link 
                href="/dashboard/parent-organization/cooperatives"
                className="text-blue-600 hover:underline"
              >
                View all {organization.cooperatives.length} cooperatives
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Withdraw Allocation</h2>
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount('');
                  setWithdrawReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Available Balance */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-purple-700 font-medium">Available Balance:</span>
                <span className="text-2xl font-bold text-purple-700">
                  ₦{availableBalance !== null ? availableBalance.toLocaleString() : '...'}
                </span>
              </div>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              {/* Amount */}
              <div>
                <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Amount (₦)
                </label>
                <input
                  type="number"
                  id="withdrawAmount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  min="1"
                  max={availableBalance || 0}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Maximum: ₦{availableBalance !== null ? availableBalance.toLocaleString() : '...'}
                </p>
              </div>

              {/* Reason */}
              <div>
                <label htmlFor="withdrawReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Withdrawal
                </label>
                <textarea
                  id="withdrawReason"
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder="Please provide a reason for this withdrawal request..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black"
                  required
                />
              </div>

              {/* Terms */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-700">
                  • Withdrawal requests are subject to approval by administrators
                  <br />• Processing time is typically 3-5 business days
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawAmount('');
                    setWithdrawReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdrawal || availableBalance === 0 || availableBalance === null}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {isSubmittingWithdrawal ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>

            {/* Withdrawal History in Modal */}
            {withdrawalHistory.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Withdrawals</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {withdrawalHistory.slice(0, 3).map((withdrawal) => (
                    <div key={withdrawal.id} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium">₦{withdrawal.amount.toLocaleString()}</span>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusColor(withdrawal.status)}`}>
                          {withdrawal.status}
                        </span>
                      </div>
                      <span className="text-gray-500">
                        {new Date(withdrawal.requestedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ 
  title, 
  value, 
  color, 
  isCurrency,
  isPercentage 
}: { 
  title: string; 
  value: number; 
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red'; 
  isCurrency?: boolean;
  isPercentage?: boolean;
}) => {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50',
    green: 'border-green-500 bg-green-50',
    purple: 'border-purple-500 bg-purple-50',
    yellow: 'border-yellow-500 bg-yellow-50',
    red: 'border-red-500 bg-red-50',
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 border-t-4 ${colorClasses[color]}`}>
      <p className={`text-sm font-medium ${
        color === 'blue' ? 'text-blue-700' :
        color === 'green' ? 'text-green-700' :
        color === 'purple' ? 'text-purple-700' :
        color === 'yellow' ? 'text-yellow-700' :
        'text-red-700'
      }`}>
        {title}
      </p>
      <p className="text-2xl font-semibold text-gray-900">
        {isCurrency ? `₦${value.toLocaleString()}` : 
         isPercentage ? `${value}%` : 
         value.toLocaleString()}
      </p>
    </div>
  );
};

const ActionCard = ({ 
  title, 
  description, 
  href 
}: { 
  title: string; 
  description: string; 
  href: string;
}) => (
  <Link href={href} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </Link>
);
