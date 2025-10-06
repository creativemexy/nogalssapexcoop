'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface ReportData {
    totalUsers: number;
    totalCooperatives: number;
    totalTransactions: number;
    totalLoans: number;
    activeLoans: number;
    pendingLoans: number;
    totalPayments: number;
    userRegistrations: Array<{ month: string; count: number }>;
    cooperativeRegistrations: Array<{ month: string; count: number }>;
    transactionVolume: Array<{ month: string; amount: number }>;
    loanPerformance: Array<{ status: string; count: number }>;
    recentUsers: Array<{
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        createdAt: string;
    }>;
    recentTransactions: Array<{
        amount: number;
        type: string;
        status: string;
        createdAt: string;
        source: string;
        user: {
            firstName: string;
            lastName: string;
        };
    }>;
}

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState('30');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    useEffect(() => {
        fetchReportData();
    }, [dateRange]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/admin/reports?range=${dateRange}`);
            if (response.ok) {
                const data = await response.json();
                setReportData(data);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to fetch report data');
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
            setError('Network error occurred while fetching data');
        } finally {
            setLoading(false);
        }
    };

    const exportReport = async (type: string) => {
        try {
            const response = await fetch(`/api/admin/reports/export?type=${type}&range=${dateRange}`,
                {
                    method: 'POST',
                }
            );
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Error exporting report:', error);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5E42] mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading report data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="text-red-600 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Reports</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={fetchReportData}
                            className="px-4 py-2 bg-[#0D5E42] text-white rounded hover:bg-[#0A4A35]"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                <Link href="/dashboard/super-admin" className="text-[#0D5E42] hover:text-[#0A4A35]">
                    &larr; Back to Dashboard
                </Link>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date Range
                        </label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D5E42]"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="365">Last year</option>
                        </select>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => exportReport('overview')}
                            className="bg-[#0D5E42] text-white px-4 py-2 rounded-md hover:bg-[#0A4A35] transition"
                        >
                            Export Overview
                        </button>
                        <button
                            onClick={() => exportReport('detailed')}
                            className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition"
                        >
                            Export Detailed
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6">
                        {[
                            { id: 'overview', name: 'Overview', icon: '📊' },
                            { id: 'users', name: 'Users', icon: '👥' },
                            { id: 'cooperatives', name: 'Cooperatives', icon: '🏢' },
                            { id: 'financial', name: 'Financial', icon: '💰' },
                            { id: 'loans', name: 'Loans', icon: '📈' },
                            { id: 'activity', name: 'Activity', icon: '📋' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab.id
                                        ? 'border-[#0D5E42] text-[#0D5E42]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow p-6">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">System Overview</h2>
                        
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-r from-[#0D5E42] to-[#0A4A35] rounded-lg p-6 text-white">
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <p className="text-sm opacity-90">Total Users</p>
                                        <p className="text-3xl font-bold">{reportData?.totalUsers || 0}</p>
                                    </div>
                                    <div className="text-4xl">👥</div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <p className="text-sm opacity-90">Cooperatives</p>
                                        <p className="text-3xl font-bold">{reportData?.totalCooperatives || 0}</p>
                                    </div>
                                    <div className="text-4xl">🏢</div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <p className="text-sm opacity-90">Transactions</p>
                                        <p className="text-3xl font-bold">{reportData?.totalTransactions || 0}</p>
                                    </div>
                                    <div className="text-4xl">💰</div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <p className="text-sm opacity-90">Active Loans</p>
                                        <p className="text-3xl font-bold">{reportData?.activeLoans || 0}</p>
                                    </div>
                                    <div className="text-4xl">📈</div>
                                </div>
                            </div>
                        </div>

                        {/* Growth Chart */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Growth</h3>
                            <div className="h-64 flex items-center justify-center text-gray-500">
                                📊 Chart visualization would go here
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">User Analytics</h2>
                        
                        {/* User Registration Chart */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Registrations (Last 6 Months)</h3>
                            <div className="space-y-2">
                                {reportData?.userRegistrations?.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">{item.month}</span>
                                        <div className="flex items-center">
                                            <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                                <div 
                                                    className="bg-[#0D5E42] h-2 rounded-full" 
                                                    style={{ width: `${(item.count / Math.max(...(reportData?.userRegistrations?.map(r => r.count) || [1]))) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">{item.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Users */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {reportData?.recentUsers?.map((user, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {user.firstName} {user.lastName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'cooperatives' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cooperative Analytics</h2>
                        
                        {/* Cooperative Registration Chart */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cooperative Registrations (Last 6 Months)</h3>
                            <div className="space-y-2">
                                {reportData?.cooperativeRegistrations?.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">{item.month}</span>
                                        <div className="flex items-center">
                                            <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                                <div 
                                                    className="bg-yellow-500 h-2 rounded-full" 
                                                    style={{ width: `${(item.count / Math.max(...(reportData?.cooperativeRegistrations?.map(r => r.count) || [1]))) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">{item.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'financial' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Financial Analytics</h2>
                        
                        {/* Transaction Volume Chart */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Volume (Last 6 Months)</h3>
                            <div className="space-y-2">
                                {reportData?.transactionVolume?.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">{item.month}</span>
                                        <div className="flex items-center">
                                            <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                                <div 
                                                    className="bg-green-500 h-2 rounded-full" 
                                                    style={{ width: `${(item.amount / Math.max(...(reportData?.transactionVolume?.map(r => r.amount) || [1]))) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">₦{item.amount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {reportData?.recentTransactions?.map((transaction, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {transaction.user.firstName} {transaction.user.lastName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <span>{transaction.type}</span>
                                                        {transaction.source === 'contribution' && (
                                                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                Contribution
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    ₦{transaction.amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        transaction.status === 'SUCCESSFUL' ? 'bg-green-100 text-green-800' :
                                                        transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {transaction.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(transaction.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'loans' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Loan Analytics</h2>
                        
                        {/* Loan Performance Chart */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Performance</h3>
                            <div className="space-y-2">
                                {reportData?.loanPerformance?.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">{item.status}</span>
                                        <div className="flex items-center">
                                            <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                                <div 
                                                    className={`h-2 rounded-full ${
                                                        item.status === 'ACTIVE' ? 'bg-green-500' :
                                                        item.status === 'PENDING' ? 'bg-yellow-500' :
                                                        item.status === 'COMPLETED' ? 'bg-blue-500' :
                                                        'bg-red-500'
                                                    }`}
                                                    style={{ width: `${(item.count / Math.max(...(reportData?.loanPerformance?.map(r => r.count) || [1]))) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">{item.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">System Activity</h2>
                        
                        {/* Activity Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 rounded-lg p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-blue-600">Total Users</p>
                                        <p className="text-2xl font-bold text-blue-900">{reportData?.totalUsers || 0}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-green-50 rounded-lg p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-green-600">Total Transactions</p>
                                        <p className="text-2xl font-bold text-green-900">{reportData?.totalTransactions || 0}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-purple-50 rounded-lg p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-purple-600">Active Loans</p>
                                        <p className="text-2xl font-bold text-purple-900">{reportData?.activeLoans || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
