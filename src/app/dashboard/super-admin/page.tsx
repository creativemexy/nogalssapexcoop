'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';

interface DashboardStats {
  totalUsers: number;
  totalCooperatives: number;
  totalTransactions: number;
  pendingLoans: number;
  approvedLoans: number;
  rejectedLoans: number;
  totalContributions: number;
  totalLoans: number;
  // Member registration fees
  totalMemberRegistrationFees: number;
  totalMemberRegistrationTransactions: number;
  currentMemberFee: number;
  // Cooperative registration fees
  totalCooperativeRegistrationFees: number;
  totalCooperativeRegistrationTransactions: number;
  currentCooperativeFee: number;
  // Legacy fields for backward compatibility
  totalRegistrationFees: number;
  totalRegistrations: number;
  totalWithdrawals: number;
  totalWithdrawalTransactions: number;
}

interface ExpenseStats {
  total: { amount: number; count: number };
  pending: { amount: number; count: number };
  approved: { amount: number; count: number };
  paid: { amount: number; count: number };
  rejected: { amount: number; count: number };
  recent: Array<{
    id: string;
    title: string;
    amount: number;
    status: string;
    category: string;
    createdAt: string;
    creator: { firstName: string; lastName: string; email: string };
  }>;
}

interface NotificationStats {
  totals: {
    emails: number;
    sms: number;
    total: number;
  };
  sent: {
    emails: number;
    sms: number;
    total: number;
  };
  failed: {
    emails: number;
    sms: number;
    total: number;
  };
  pending: {
    emails: number;
    sms: number;
    total: number;
  };
  successRates: {
    emails: number;
    sms: number;
  };
  costs: {
    totalSMSCost: number;
    averageSMSCost: number;
  };
  recent: Array<{
    id: string;
    type: string;
    recipient: string;
    subject?: string;
    status: string;
    cost?: number;
    createdAt: string;
    sentAt?: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function SuperAdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expenseStats, setExpenseStats] = useState<ExpenseStats | null>(null);
  const [notificationStats, setNotificationStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationFee, setRegistrationFee] = useState<number | null>(null);
  const [global2FAEnabled, setGlobal2FAEnabled] = useState<boolean | null>(null);
  const [notificationPage, setNotificationPage] = useState(1);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchDashboardStats();
    };
    socket.on('dashboard:update', handleUpdate);
    return () => {
      socket.off('dashboard:update', handleUpdate);
    };
  }, [socket]);

  useEffect(() => {
    fetchDashboardStats();
    fetchExpenseStats();
    fetchNotificationStats();
    fetchRegistrationFee();
    fetch2FAStatus();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseStats = async () => {
    try {
      const response = await fetch('/api/admin/expense-stats');
      const data = await response.json();
      setExpenseStats(data);
    } catch (error) {
      console.error('Error fetching expense stats:', error);
    }
  };

  const fetchNotificationStats = async (page: number = 1) => {
    try {
      const response = await fetch(`/api/admin/notifications/stats?page=${page}&limit=4`);
      const data = await response.json();
      setNotificationStats(data);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  const fetchRegistrationFee = async () => {
    try {
      const response = await fetch('/api/public/registration-fee');
      const data = await response.json();
      if (response.ok) {
        setRegistrationFee(data.registrationFee);
      } else {
        setRegistrationFee(null);
      }
    } catch (error) {
      console.error('Error fetching registration fee:', error);
      setRegistrationFee(null);
    }
  };

  const fetch2FAStatus = async () => {
    try {
      const res = await fetch('/api/admin/2fa/global');
      const data = await res.json();
      if (res.ok) {
        setGlobal2FAEnabled(Boolean(data.enabled));
      } else {
        console.error('Failed to fetch 2FA status:', data);
        setGlobal2FAEnabled(false); // Default to false instead of null
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
      setGlobal2FAEnabled(false); // Default to false instead of null
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">Super Admin Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {loading ? '...' : stats?.totalUsers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Member Registration Fee</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {loading ? '...' : `₦${(stats?.currentMemberFee || 5000).toLocaleString()}`}
              </p>
              <p className="text-xs text-gray-500">{stats?.totalMemberRegistrationTransactions || 0} members registered</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Cooperative Registration Fee</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {loading ? '...' : `₦${(stats?.currentCooperativeFee || 50000).toLocaleString()}`}
              </p>
              <p className="text-xs text-gray-500">{stats?.totalCooperativeRegistrationTransactions || 0} cooperatives registered</p>
            </div>
          </div>
        </div>


        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Cooperatives</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {loading ? '...' : stats?.totalCooperatives || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Transactions</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {loading ? '...' : stats?.totalTransactions || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Registration Fees</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {loading ? '...' : `₦${(stats?.totalRegistrationFees || 0).toLocaleString()}`}
              </p>
              <p className="text-xs text-gray-500">{stats?.totalRegistrations || 0} total registrations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/dashboard/super-admin/pending-loans" className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Loans</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : stats?.pendingLoans || 0}
              </p>
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved Loans</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : stats?.approvedLoans || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected Loans</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : stats?.rejectedLoans || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
            <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Contributions</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {loading ? '...' : `₦${(stats?.totalContributions || 0).toLocaleString()}`}
                    </p>
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
            <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Loans</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {loading ? '...' : `₦${(stats?.totalLoans || 0).toLocaleString()}`}
                    </p>
                </div>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
            <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Withdrawals</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {loading ? '...' : `₦${(stats?.totalWithdrawals || 0).toLocaleString()}`}
                    </p>
                    <p className="text-xs text-gray-500">{stats?.totalWithdrawalTransactions || 0} withdrawals made</p>
                </div>
            </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">System Settings</h2>
        
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Global 2FA Status</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {global2FAEnabled === null ? '...' : global2FAEnabled ? 'Enabled' : 'Disabled'}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/dashboard/super-admin/2fa-setup"
                    className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                  >Setup Your 2FA</Link>
                  <button
                    className="px-3 py-1 text-sm rounded bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={global2FAEnabled === null || global2FAEnabled === true}
                    onClick={async () => {
                      const res = await fetch('/api/admin/2fa/global', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ enabled: true })
                      });
                      if (res.ok) {
                        alert('Global 2FA enabled for all users. Users must set up 2FA to login.');
                        setGlobal2FAEnabled(true);
                      }
                    }}
                  >Enable Global 2FA</button>
                  <button
                    className="px-3 py-1 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={global2FAEnabled !== true}
                    onClick={async () => {
                      const res = await fetch('/api/admin/2fa/global', { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ enabled: false })
                      });
                      if (res.ok) {
                        alert('Global 2FA disabled. Users can login without 2FA.');
                        setGlobal2FAEnabled(false);
                      }
                    }}
                  >Disable Global 2FA</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Expense Statistics */}
      {expenseStats && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Expense Management</h2>
          
          {/* Expense Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Expenses</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    ₦{(expenseStats.total?.amount || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{expenseStats.total?.count || 0} expenses</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    ₦{(expenseStats.pending?.amount || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{expenseStats.pending?.count || 0} pending</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Approved</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    ₦{(expenseStats.approved?.amount || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{expenseStats.approved?.count || 0} approved</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Paid</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    ₦{(expenseStats.paid?.amount || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{expenseStats.paid?.count || 0} paid</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Rejected</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    ₦{(expenseStats.rejected?.amount || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{expenseStats.rejected?.count || 0} rejected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Expenses</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-600 dark:text-gray-300">Title</th>
                    <th className="text-left py-2 text-gray-600 dark:text-gray-300">Amount</th>
                    <th className="text-left py-2 text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-left py-2 text-gray-600 dark:text-gray-300">Category</th>
                    <th className="text-left py-2 text-gray-600 dark:text-gray-300">Created By</th>
                    <th className="text-left py-2 text-gray-600 dark:text-gray-300">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseStats.recent?.map((expense) => (
                    <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 text-gray-900 dark:text-gray-100">
                        {expense.title}
                      </td>
                      <td className="py-2 text-gray-900 dark:text-gray-100">
                        ₦{expense.amount.toLocaleString()}
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          expense.status === 'PENDING' 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : expense.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : expense.status === 'PAID'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="py-2 text-gray-900 dark:text-gray-100">
                        {expense.category.replace('_', ' ')}
                      </td>
                      <td className="py-2 text-gray-900 dark:text-gray-100">
                        {expense.creator.firstName} {expense.creator.lastName}
                      </td>
                      <td className="py-2 text-gray-500 dark:text-gray-400">
                        {new Date(expense.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Notification Statistics */}
      {notificationStats && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Notification Statistics</h2>
          
          {/* Notification Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Emails</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {notificationStats.totals?.emails || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total SMS</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {notificationStats.totals?.sms || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Success Rate</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {notificationStats.successRates?.emails?.toFixed(1) || '0.0'}% / {notificationStats.successRates?.sms?.toFixed(1) || '0.0'}%
                  </p>
                  <p className="text-xs text-gray-500">Email / SMS</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">SMS Cost</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    ₦{(notificationStats.costs?.totalSMSCost || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">Avg: ₦{(notificationStats.costs?.averageSMSCost || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Notifications</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-600 dark:text-gray-300">Type</th>
                    <th className="text-left py-2 text-gray-600 dark:text-gray-300">Recipient</th>
                    <th className="text-left py-2 text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-left py-2 text-gray-600 dark:text-gray-300">Cost</th>
                    <th className="text-left py-2 text-gray-600 dark:text-gray-300">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {notificationStats.recent?.map((notification) => (
                    <tr key={notification.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          notification.type === 'EMAIL' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {notification.type}
                        </span>
                      </td>
                      <td className="py-2 text-gray-900 dark:text-gray-100">
                        {notification.recipient}
                        {notification.subject && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {notification.subject}
                          </div>
                        )}
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          notification.status === 'SENT' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : notification.status === 'FAILED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {notification.status}
                        </span>
                      </td>
                      <td className="py-2 text-gray-900 dark:text-gray-100">
                        {notification.cost ? `₦${notification.cost.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-2 text-gray-500 dark:text-gray-400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {notificationStats.pagination && notificationStats.pagination.totalPages && notificationStats.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {((notificationStats.pagination.page - 1) * notificationStats.pagination.limit) + 1} to {Math.min(notificationStats.pagination.page * notificationStats.pagination.limit, notificationStats.pagination.total)} of {notificationStats.pagination.total} notifications
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setNotificationPage(notificationStats.pagination.page - 1);
                      fetchNotificationStats(notificationStats.pagination.page - 1);
                    }}
                    disabled={!notificationStats.pagination.hasPrev}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {notificationStats.pagination.page} of {notificationStats.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => {
                      setNotificationPage(notificationStats.pagination.page + 1);
                      fetchNotificationStats(notificationStats.pagination.page + 1);
                    }}
                    disabled={!notificationStats.pagination.hasNext}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/dashboard/super-admin/users" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Manage Users</h3>
              <p className="text-sm text-gray-600">View and manage all users</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/create-apex" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Create Apex User</h3>
              <p className="text-sm text-gray-600">Add a new Apex-level user</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/create-finance" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Create Finance User</h3>
              <p className="text-sm text-gray-600">Add a new Finance user</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/create-apex-funds" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Create Apex Funds User</h3>
              <p className="text-sm text-gray-600">Add a new Apex Funds user</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/create-nogalss-funds" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Create Nogalss Funds User</h3>
              <p className="text-sm text-gray-600">Add a new Nogalss Funds user</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/cooperatives" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Manage Cooperatives</h3>
              <p className="text-sm text-gray-600">Oversee all cooperatives</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/partners" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Manage Partners</h3>
              <p className="text-sm text-gray-600">Add, edit, or remove homepage partners</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/transactions" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">View Transactions</h3>
              <p className="text-sm text-gray-600">Monitor all transactions</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/reports" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Reports & Analytics</h3>
              <p className="text-sm text-gray-600">View detailed reports</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/settings" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
              <p className="text-sm text-gray-600">Configure platform settings</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/administrative-fees" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Administrative Fees</h3>
              <p className="text-sm text-gray-600">View registration fee splits and totals</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/logs" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">User Activity Logs</h3>
              <p className="text-sm text-gray-600">View all system user actions</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/impersonate" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Impersonate Users</h3>
              <p className="text-sm text-gray-600">Login as other users for support</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/sessions" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Session Management</h3>
              <p className="text-sm text-gray-600">Monitor and control user sessions</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/security" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Security Dashboard</h3>
              <p className="text-sm text-gray-600">Monitor security status and vulnerabilities</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/emergency-alerts" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Emergency Alerts</h3>
              <p className="text-sm text-gray-600">Create and manage critical system alerts</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/health" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">System Health</h3>
              <p className="text-sm text-gray-600">Monitor system performance and health metrics</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/events" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Manage Events</h3>
              <p className="text-sm text-gray-600">Create, edit, and manage events</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/contact" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Contact Messages</h3>
              <p className="text-sm text-gray-600">View and manage contact form submissions</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/git-update" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Git Update Manager</h3>
              <p className="text-sm text-gray-600">Check for updates and deploy code changes</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/super-admin/expenses" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Expense Management</h3>
              <p className="text-sm text-gray-600">Review and approve expense requests</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}