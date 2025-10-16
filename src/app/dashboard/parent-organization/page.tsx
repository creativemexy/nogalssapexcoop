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

  useEffect(() => {
    fetchOrganizationData();
  }, []);

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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Organization Information</h2>
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
