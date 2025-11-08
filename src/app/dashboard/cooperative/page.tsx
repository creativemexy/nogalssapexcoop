'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';

interface CooperativeStats {
  totalMembers: number;
  totalContributions: number;
  totalLoans: number;
  activeLoans: number;
  pendingLoans: number;
  registrationFees: number;
  allocationPercentage: number;
  allocationAmount: number;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    date: string;
    memberName: string;
  }>;
  memberStats: {
    activeMembers: number;
    newMembersThisMonth: number;
    averageContribution: number;
  };
  virtualAccount?: {
    id: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
    accountType: string;
    isActive: boolean;
  };
}

export default function CooperativeDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<CooperativeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();

  useEffect(() => {
    fetchCooperativeStats();
    
    if (socket) {
      socket.on('dashboard:update', fetchCooperativeStats);
      return () => {
        socket.off('dashboard:update', fetchCooperativeStats);
      };
    }
  }, [socket]);

  const fetchCooperativeStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cooperative/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch cooperative statistics');
      }
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading cooperative dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading dashboard</div>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Cooperative Dashboard</h1>
          <div className="flex space-x-4">
            <Link 
              href="/dashboard/cooperative/members" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Manage Members
            </Link>
            <Link 
              href="/dashboard/cooperative/transactions" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              View Transactions
            </Link>
            <Link 
              href="/dashboard/cooperative/withdraw" 
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Withdraw Allocation
            </Link>
          </div>
        </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Members</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {stats?.totalMembers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Contributions</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                ₦{(stats?.totalContributions || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Loans</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {stats?.activeLoans || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Registration Fees</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                ₦{(stats?.registrationFees || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Financial Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Total Contributions</span>
              <span className="font-semibold text-green-600">₦{(stats?.totalContributions || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Total Loans Disbursed</span>
              <span className="font-semibold text-blue-600">₦{(stats?.totalLoans || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Registration Fees</span>
              <span className="font-semibold text-red-600">₦{(stats?.registrationFees || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">{stats?.allocationPercentage || 20}% Allocation</span>
              <span className="font-semibold text-green-600">₦{(stats?.allocationAmount || 0).toLocaleString()}</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 dark:text-gray-100 font-semibold">Net Position</span>
                <span className="font-bold text-lg">
                  ₦{((stats?.totalContributions || 0) - (stats?.totalLoans || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Member Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Active Members</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{stats?.memberStats.activeMembers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">New Members This Month</span>
              <span className="font-semibold text-green-600">{stats?.memberStats.newMembersThisMonth || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Average Contribution</span>
              <span className="font-semibold text-blue-600">₦{(stats?.memberStats.averageContribution || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Pending Loans</span>
              <span className="font-semibold text-yellow-600">{stats?.pendingLoans || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Account Section */}
      {stats?.virtualAccount && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Virtual Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">Account Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">Account Name:</span>
                  <span className="font-semibold text-green-800 dark:text-green-200">{stats.virtualAccount.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">Account Number:</span>
                  <span className="font-semibold text-green-800 dark:text-green-200">{stats.virtualAccount.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">Bank:</span>
                  <span className="font-semibold text-green-800 dark:text-green-200">{stats.virtualAccount.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">Status:</span>
                  <span className={`font-semibold ${stats.virtualAccount.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.virtualAccount.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/dashboard/cooperative/personal/contribute"
                  className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Make Contribution
                </Link>
                <Link
                  href="/dashboard/cooperative/personal/apply-loan"
                  className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply for Loan
                </Link>
                <Link
                  href="/dashboard/cooperative/personal/allocations"
                  className="block w-full bg-purple-600 text-white text-center py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  View Allocations
                </Link>
                <Link
                  href="/dashboard/2fa-setup"
                  className="block w-full bg-red-600 text-white text-center py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  🔐 2FA Security
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Transactions</h2>
          <Link 
            href="/dashboard/cooperative/transactions" 
            className="text-blue-600 hover:text-blue-500 text-sm"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-600 dark:text-gray-300">Type</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-300">Member</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-300">Description</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-300">Amount</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentTransactions?.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      transaction.type === 'CONTRIBUTION' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : transaction.type === 'LOAN'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="py-2 text-gray-900 dark:text-gray-100">{transaction.memberName}</td>
                  <td className="py-2 text-gray-600 dark:text-gray-300">{transaction.description}</td>
                  <td className="py-2 font-semibold text-gray-900 dark:text-gray-100">
                    ₦{transaction.amount.toLocaleString()}
                  </td>
                  <td className="py-2 text-gray-500 dark:text-gray-400">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500 dark:text-gray-400">
                    No recent transactions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 