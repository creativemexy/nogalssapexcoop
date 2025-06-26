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
}

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState('30');
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    useEffect(() => {
        fetchReportData();
    }, [dateRange]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/reports?range=${dateRange}`);
            if (response.ok) {
                const data = await response.json();
                setReportData(data);
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5E42]"></div>
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
                        <div className="text-center text-gray-500 py-8">
                            User analytics data will be displayed here
                        </div>
                    </div>
                )}

                {activeTab === 'cooperatives' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cooperative Analytics</h2>
                        <div className="text-center text-gray-500 py-8">
                            Cooperative analytics data will be displayed here
                        </div>
                    </div>
                )}

                {activeTab === 'financial' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Financial Analytics</h2>
                        <div className="text-center text-gray-500 py-8">
                            Financial analytics data will be displayed here
                        </div>
                    </div>
                )}

                {activeTab === 'loans' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Loan Analytics</h2>
                        <div className="text-center text-gray-500 py-8">
                            Loan analytics data will be displayed here
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">System Activity</h2>
                        <div className="text-center text-gray-500 py-8">
                            System activity data will be displayed here
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
