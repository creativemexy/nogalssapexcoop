'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';

interface FinancialOverview {
  totalContributions: number;
  totalLoans: number;
  totalExpenses: number;
  netPosition: number;
  monthlyContributions: Array<{
    month: string;
    amount: number;
  }>;
  loanStatusBreakdown: {
    active: number;
    pending: number;
    completed: number;
    defaulted: number;
  };
  topContributors: Array<{
    memberName: string;
    totalContributions: number;
    memberId: string;
  }>;
  recentExpenses: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    memberName: string;
  }>;
}

export default function FinancialOverviewPage() {
  const { data: session } = useSession();
  const [financialData, setFinancialData] = useState<FinancialOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();

  useEffect(() => {
    fetchFinancialData();
    
    if (socket) {
      socket.on('dashboard:update', fetchFinancialData);
      return () => {
        socket.off('dashboard:update', fetchFinancialData);
      };
    }
  }, [socket]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cooperative/financial');
      if (!response.ok) {
        throw new Error('Failed to fetch financial data');
      }
      const data = await response.json();
      setFinancialData(data);
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
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading financial overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error loading financial data</div>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Financial Overview</h1>
        <Link 
          href="/dashboard/cooperative" 
          className="text-[#0D5E42] hover:text-[#0A4A35] dark:text-green-400 dark:hover:text-green-300"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Contributions</p>
              <p className="text-2xl font-semibold text-green-600">
                ₦{(financialData?.totalContributions || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Loans</p>
              <p className="text-2xl font-semibold text-blue-600">
                ₦{(financialData?.totalLoans || 0).toLocaleString()}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Expenses</p>
              <p className="text-2xl font-semibold text-red-600">
                ₦{(financialData?.totalExpenses || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              (financialData?.netPosition || 0) >= 0 
                ? 'bg-green-100 dark:bg-green-900' 
                : 'bg-red-100 dark:bg-red-900'
            }`}>
              <svg className={`w-6 h-6 ${
                (financialData?.netPosition || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Net Position</p>
              <p className={`text-2xl font-semibold ${
                (financialData?.netPosition || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₦{(financialData?.netPosition || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Loan Status Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Loan Status Breakdown</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Active Loans</span>
              <span className="font-semibold text-blue-600">{financialData?.loanStatusBreakdown.active || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Pending Loans</span>
              <span className="font-semibold text-yellow-600">{financialData?.loanStatusBreakdown.pending || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Completed Loans</span>
              <span className="font-semibold text-green-600">{financialData?.loanStatusBreakdown.completed || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300">Defaulted Loans</span>
              <span className="font-semibold text-red-600">{financialData?.loanStatusBreakdown.defaulted || 0}</span>
            </div>
          </div>
        </div>

        {/* Top Contributors */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Contributors</h2>
          <div className="space-y-3">
            {financialData?.topContributors?.slice(0, 5).map((contributor, index) => (
              <div key={contributor.memberId} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full flex items-center justify-center mr-3">
                    {index + 1}
                  </span>
                  <span className="text-gray-900 dark:text-gray-100">{contributor.memberName}</span>
                </div>
                <span className="font-semibold text-green-600">
                  ₦{contributor.totalContributions.toLocaleString()}
                </span>
              </div>
            )) || (
              <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                No contribution data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Expenses</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-600 dark:text-gray-300">Description</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-300">Member</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-300">Amount</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {financialData?.recentExpenses?.map((expense) => (
                <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 text-gray-900 dark:text-gray-100">{expense.description}</td>
                  <td className="py-2 text-gray-600 dark:text-gray-300">{expense.memberName}</td>
                  <td className="py-2 font-semibold text-red-600">
                    ₦{expense.amount.toLocaleString()}
                  </td>
                  <td className="py-2 text-gray-500 dark:text-gray-400">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500 dark:text-gray-400">
                    No recent expenses
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
