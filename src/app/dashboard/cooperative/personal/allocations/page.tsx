'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';

interface AllocationStats {
  totalAllocations: number;
  recentTransactions: Array<{
    id: string;
    amount: number;
    description: string;
    createdAt: string;
    memberName: string;
  }>;
  monthlyBreakdown: Array<{
    month: string;
    amount: number;
  }>;
  summary: {
    totalMembers: number;
    totalAllocated: number;
    averageAllocation: number;
  };
}

export default function CooperativeAllocationsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AllocationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();

  const fetchAllocationStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/cooperative/allocations');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      } else {
        setError(data.error || 'Failed to fetch allocation statistics');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllocationStats();
    
    if (socket) {
      socket.on('dashboard:update', fetchAllocationStats);
      return () => {
        socket.off('dashboard:update', fetchAllocationStats);
      };
    }
  }, [socket, fetchAllocationStats]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading allocation statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading allocations</div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchAllocationStats}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Cooperative Allocations</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              View your 20% share of registration fees from your members
            </p>
          </div>
          <Link
            href="/dashboard/cooperative"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Allocations</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                ₦{(stats?.totalAllocations || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Members</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {stats?.summary.totalMembers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Average Allocation</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                ₦{(stats?.summary.averageAllocation || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Allocation Breakdown</h2>
        <div className="space-y-4">
          {stats?.monthlyBreakdown && stats.monthlyBreakdown.length > 0 ? (
            stats.monthlyBreakdown.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{month.month}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">20% of registration fees from members</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-600">₦{month.amount.toLocaleString()}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Allocation Data</h3>
              <p className="text-gray-600 dark:text-gray-300">
                You haven't received any allocations yet. Allocations are generated when your members pay registration fees.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Allocation Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-600 dark:text-gray-300">Member</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-300">Amount</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-300">Description</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 text-gray-900 dark:text-gray-100">{transaction.memberName}</td>
                    <td className="py-3 text-green-600 font-semibold">₦{transaction.amount.toLocaleString()}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">{transaction.description}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-300">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Recent Transactions</h3>
              <p className="text-gray-600 dark:text-gray-300">
                No allocation transactions found. Transactions will appear here when your members pay registration fees.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


