'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface DashboardStats {
  totalRegistrationFees: number;
  totalTransactions: number;
  apexFundAllocation: number;
  allocationPercentage: number;
  recentTransactions: Array<{
    id: string;
    amount: number;
    payer: string;
    email: string;
    reference: string;
    createdAt: string;
    description: string;
    apexAllocation: number;
  }>;
  monthlyBreakdown: Array<{
    month: string;
    totalFees: number;
    apexAllocation: number;
    transactionCount: number;
  }>;
  averageTransactionValue: number;
  averageApexAllocation: number;
}

export default function ApexFundsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [error, setError] = useState<string | null>(null);

  const socket = useSocket();
  
  const fetchDashboardStats = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/apex-funds/dashboard-stats', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
        setLastUpdated(new Date());
      } else {
        setError(data.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Network error - unable to fetch data');
    }
  }, []);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = () => {
      console.log('🔄 Real-time update received for Apex Fund dashboard');
      fetchDashboardStats();
    };
    
    const handleUserActivity = (data: any) => {
      if (data.type === 'USER_LOGIN' || data.type === 'TRANSACTION_CREATED') {
        console.log('🔄 User activity detected, refreshing Apex Fund dashboard');
        fetchDashboardStats();
      }
    };
    
    socket.on('dashboard:update', handleUpdate);
    socket.on('user:activity', handleUserActivity);
    
    return () => {
      socket.off('dashboard:update', handleUpdate);
      socket.off('user:activity', handleUserActivity);
    };
  }, [socket, fetchDashboardStats]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing Apex Fund dashboard');
      fetchDashboardStats();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchDashboardStats]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardStats().finally(() => setLoading(false));
  }, [fetchDashboardStats]);

  // Manual refresh function
  const handleManualRefresh = () => {
    setLoading(true);
    fetchDashboardStats().finally(() => setLoading(false));
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Apex Fund Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleManualRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Controls */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Apex Fund Dashboard</h1>
            <p className="text-gray-600">Track your 40% allocation from registration fees</p>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
              {loading && <span className="ml-2 text-blue-600">🔄 Updating...</span>}
            </p>
          </div>
          
          {/* Dynamic Controls */}
          <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-4">
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Updating...' : 'Refresh'}
            </button>
            
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Interval:</label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
                disabled={!autoRefresh}
              >
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
                <option value={60000}>1m</option>
                <option value={300000}>5m</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Key Metrics with Animations */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-500">Total Registration Fees</h3>
              <p className="text-2xl font-bold text-gray-900 animate-pulse">
                ₦{stats.totalRegistrationFees.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.totalTransactions} transactions
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-500">Apex Fund Allocation (40%)</h3>
              <p className="text-2xl font-bold text-green-600 animate-pulse">
                ₦{stats.apexFundAllocation.toLocaleString()}
              </p>
              <div className="flex items-center mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: '40%' }}
                  ></div>
                </div>
                <span className="text-xs text-gray-400 ml-2">40%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
              <p className="text-2xl font-bold text-purple-600 animate-pulse">
                {stats.totalTransactions.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.averageTransactionValue > 0 ? `Avg: ₦${stats.averageTransactionValue.toLocaleString()}` : 'No transactions yet'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Avg. Allocation per Transaction</h3>
              <p className="text-2xl font-bold text-orange-600">₦{stats.averageApexAllocation.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Allocation Trend</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Apex Fund (40%)
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {stats.monthlyBreakdown.slice(-6).map((month, index) => {
              const maxAllocation = Math.max(...stats.monthlyBreakdown.map(m => m.apexAllocation));
              const height = maxAllocation > 0 ? (month.apexAllocation / maxAllocation) * 100 : 0;
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="bg-green-500 rounded-t w-full transition-all duration-1000 hover:bg-green-600"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${month.month}: ₦${month.apexAllocation.toLocaleString()}`}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                    {month.month.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Allocation Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Allocation Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm font-medium">Apex Fund</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">₦{stats.apexFundAllocation.toLocaleString()}</div>
                <div className="text-xs text-gray-500">40%</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm font-medium">Nogalss Fund</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">₦{(stats.totalRegistrationFees * 0.2).toLocaleString()}</div>
                <div className="text-xs text-gray-500">20%</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm font-medium">Cooperative</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-purple-600">₦{(stats.totalRegistrationFees * 0.2).toLocaleString()}</div>
                <div className="text-xs text-gray-500">20%</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm font-medium">Leader</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-orange-600">₦{(stats.totalRegistrationFees * 0.2).toLocaleString()}</div>
                <div className="text-xs text-gray-500">20%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Registration Fee Allocations</h2>
          <p className="text-sm text-gray-600">Showing your 40% allocation from recent registrations</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apex Allocation (40%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{transaction.payer}</div>
                      <div className="text-sm text-gray-500">{transaction.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₦{transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ₦{transaction.apexAllocation.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.reference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Allocation Breakdown</h2>
          <p className="text-sm text-gray-600">Your 40% allocation over the last 12 months</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.monthlyBreakdown.map((month, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{month.month}</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Fees:</span>
                    <span className="font-medium">₦{month.totalFees.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Apex Allocation:</span>
                    <span className="font-medium text-green-600">₦{month.apexAllocation.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

