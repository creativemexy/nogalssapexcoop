'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ReportData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalInflow: number;
    totalOutflow: number;
    netBalance: number;
    inflowGrowth: number;
    outflowGrowth: number;
    balanceGrowth: number;
  };
  breakdown: {
    adminFees: { amount: number; count: number; percentage: number };
    contributions: { amount: number; count: number; percentage: number };
    loanRepayments: { amount: number; count: number; percentage: number };
    loans: { amount: number; count: number; percentage: number };
    withdrawals: { amount: number; count: number; percentage: number };
  };
  activity: {
    newUsers: number;
    totalTransactions: number;
    averageTransactionAmount: number;
  };
  trends: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    description: string;
    createdAt: string;
    user: {
      name: string;
      email: string;
      role: string;
    } | null;
  }>;
  comparison: {
    previousPeriod: {
      totalInflow: number;
      totalOutflow: number;
      netBalance: number;
    };
    growth: {
      inflow: number;
      outflow: number;
      balance: number;
    };
  };
}

export default function FinanceReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const fetchReport = async (period: string, startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ period });
      if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }
      
      const res = await fetch(`/api/finance/reports?${params}`);
      if (!res.ok) throw new Error('Failed to fetch report data');
      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const periodParam = urlParams.get('period');
    if (periodParam && ['daily', 'weekly', 'monthly', 'yearly'].includes(periodParam)) {
      setSelectedPeriod(periodParam);
      fetchReport(periodParam);
    } else {
      fetchReport(selectedPeriod);
    }
  }, [selectedPeriod]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (period === 'custom') {
      // Don't fetch yet, wait for custom dates
      return;
    }
    fetchReport(period);
  };

  const handleCustomDateSubmit = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      fetchReport('custom', customDateRange.startDate, customDateRange.endDate);
    }
  };

  const generateCSVReport = () => {
    if (!reportData) return;
    
    const csvContent = `Date,Type,Amount,User,Description
${reportData.transactions.map(t => 
  `${new Date(t.createdAt).toLocaleDateString()},${t.type},${t.amount},${t.user?.name || 'Unknown'},${t.description}`
).join('\n')}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-transactions-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateDetailedReport = () => {
    if (!reportData) return;
    
    const reportContent = `
NOGALSS COOPERATIVE FINANCIAL REPORT
Period: ${selectedPeriod.toUpperCase()}
Date Range: ${new Date(reportData.dateRange.start).toLocaleDateString()} - ${new Date(reportData.dateRange.end).toLocaleDateString()}
Generated: ${new Date().toLocaleString()}

=== FINANCIAL SUMMARY ===
Total Inflow: ₦${reportData.summary.totalInflow.toLocaleString()}
Total Outflow: ₦${reportData.summary.totalOutflow.toLocaleString()}
Net Balance: ₦${reportData.summary.netBalance.toLocaleString()}

Growth vs Previous Period:
- Inflow Growth: ${reportData.summary.inflowGrowth > 0 ? '+' : ''}${reportData.summary.inflowGrowth}%
- Outflow Growth: ${reportData.summary.outflowGrowth > 0 ? '+' : ''}${reportData.summary.outflowGrowth}%
- Balance Growth: ${reportData.summary.balanceGrowth > 0 ? '+' : ''}${reportData.summary.balanceGrowth}%

=== DETAILED BREAKDOWN ===
Administrative Fees:
- Amount: ₦${reportData.breakdown.adminFees.amount.toLocaleString()}
- Count: ${reportData.breakdown.adminFees.count} transactions
- Percentage of Inflow: ${reportData.breakdown.adminFees.percentage.toFixed(2)}%

Contributions/Savings:
- Amount: ₦${reportData.breakdown.contributions.amount.toLocaleString()}
- Count: ${reportData.breakdown.contributions.count} transactions
- Percentage of Inflow: ${reportData.breakdown.contributions.percentage.toFixed(2)}%

Loan Repayments:
- Amount: ₦${reportData.breakdown.loanRepayments.amount.toLocaleString()}
- Count: ${reportData.breakdown.loanRepayments.count} transactions
- Percentage of Inflow: ${reportData.breakdown.loanRepayments.percentage.toFixed(2)}%

Loans:
- Amount: ₦${reportData.breakdown.loans.amount.toLocaleString()}
- Count: ${reportData.breakdown.loans.count} loans
- Percentage of Outflow: ${reportData.breakdown.loans.percentage.toFixed(2)}%

Withdrawals:
- Amount: ₦${reportData.breakdown.withdrawals.amount.toLocaleString()}
- Count: ${reportData.breakdown.withdrawals.count} transactions
- Percentage of Outflow: ${reportData.breakdown.withdrawals.percentage.toFixed(2)}%

=== ACTIVITY METRICS ===
New Users: ${reportData.activity.newUsers}
Total Transactions: ${reportData.activity.totalTransactions}
Average Transaction Amount: ₦${reportData.activity.averageTransactionAmount.toLocaleString()}

=== RECENT TRANSACTIONS ===
${reportData.transactions.slice(0, 20).map(t => 
  `${t.type}: ₦${t.amount.toLocaleString()} - ${t.user?.name || 'Unknown'} (${new Date(t.createdAt).toLocaleDateString()})`
).join('\n')}

=== TRENDS ANALYSIS ===
${reportData.trends.map(trend => 
  `${trend.date}: ₦${trend.amount.toLocaleString()} (${trend.count} transactions)`
).join('\n')}

This report was generated by the Nogalss Cooperative Finance System.
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 font-semibold">{error}</div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">No report data available</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
        <div className="flex space-x-4">
          <button
            onClick={generateDetailedReport}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            📄 Download Report
          </button>
          <button
            onClick={generateCSVReport}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            📊 Export CSV
          </button>
          <Link href="/dashboard/finance" className="text-green-600 hover:text-green-700">
            ← Back to Finance Dashboard
          </Link>
        </div>
      </div>

      {/* Period Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Period</h2>
        <div className="flex flex-wrap gap-4">
          {['daily', 'weekly', 'monthly', 'yearly', 'custom'].map((period) => (
            <button
              key={period}
              onClick={() => handlePeriodChange(period)}
              className={`px-4 py-2 rounded ${
                selectedPeriod === period
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
        
        {selectedPeriod === 'custom' && (
          <div className="mt-4 flex gap-4">
            <input
              type="date"
              value={customDateRange.startDate}
              onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-2"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={customDateRange.endDate}
              onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-2"
              placeholder="End Date"
            />
            <button
              onClick={handleCustomDateSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Generate Report
            </button>
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-medium text-gray-900">Total Inflow</h3>
          <p className="text-3xl font-bold text-green-600">₦{reportData.summary.totalInflow.toLocaleString()}</p>
          <p className={`text-sm mt-1 ${reportData.summary.inflowGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {reportData.summary.inflowGrowth >= 0 ? '↗' : '↘'} {Math.abs(reportData.summary.inflowGrowth)}% vs previous period
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <h3 className="text-lg font-medium text-gray-900">Total Outflow</h3>
          <p className="text-3xl font-bold text-red-600">₦{reportData.summary.totalOutflow.toLocaleString()}</p>
          <p className={`text-sm mt-1 ${reportData.summary.outflowGrowth >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {reportData.summary.outflowGrowth >= 0 ? '↗' : '↘'} {Math.abs(reportData.summary.outflowGrowth)}% vs previous period
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-medium text-gray-900">Net Balance</h3>
          <p className={`text-3xl font-bold ${reportData.summary.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            ₦{reportData.summary.netBalance.toLocaleString()}
          </p>
          <p className={`text-sm mt-1 ${reportData.summary.balanceGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {reportData.summary.balanceGrowth >= 0 ? '↗' : '↘'} {Math.abs(reportData.summary.balanceGrowth)}% vs previous period
          </p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Admin Fees</h3>
          <p className="text-2xl font-bold text-purple-600">₦{reportData.breakdown.adminFees.amount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">{reportData.breakdown.adminFees.count} transactions</p>
          <p className="text-xs text-gray-400">{reportData.breakdown.adminFees.percentage.toFixed(1)}% of inflow</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Contributions</h3>
          <p className="text-2xl font-bold text-green-600">₦{reportData.breakdown.contributions.amount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">{reportData.breakdown.contributions.count} transactions</p>
          <p className="text-xs text-gray-400">{reportData.breakdown.contributions.percentage.toFixed(1)}% of inflow</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Loan Repayments</h3>
          <p className="text-2xl font-bold text-blue-600">₦{reportData.breakdown.loanRepayments.amount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">{reportData.breakdown.loanRepayments.count} transactions</p>
          <p className="text-xs text-gray-400">{reportData.breakdown.loanRepayments.percentage.toFixed(1)}% of inflow</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Loans</h3>
          <p className="text-2xl font-bold text-orange-600">₦{reportData.breakdown.loans.amount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">{reportData.breakdown.loans.count} loans</p>
          <p className="text-xs text-gray-400">{reportData.breakdown.loans.percentage.toFixed(1)}% of outflow</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Withdrawals</h3>
          <p className="text-2xl font-bold text-red-600">₦{reportData.breakdown.withdrawals.amount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">{reportData.breakdown.withdrawals.count} transactions</p>
          <p className="text-xs text-gray-400">{reportData.breakdown.withdrawals.percentage.toFixed(1)}% of outflow</p>
        </div>
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">New Users</h3>
          <p className="text-3xl font-bold text-indigo-600">{reportData.activity.newUsers}</p>
          <p className="text-sm text-gray-500">Registered this period</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Transactions</h3>
          <p className="text-3xl font-bold text-purple-600">{reportData.activity.totalTransactions}</p>
          <p className="text-sm text-gray-500">Completed this period</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Avg Transaction</h3>
          <p className="text-3xl font-bold text-teal-600">₦{reportData.activity.averageTransactionAmount.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Per transaction</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.transactions.slice(0, 10).map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.type === 'CONTRIBUTION' ? 'bg-green-100 text-green-800' :
                      transaction.type === 'WITHDRAWAL' ? 'bg-red-100 text-red-800' :
                      transaction.type === 'FEE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ₦{transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.user?.name || 'Unknown User'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trends Chart Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Trends</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Trend visualization would be implemented here</p>
          <p className="text-sm">Data points: {reportData.trends.length} days</p>
        </div>
      </div>
    </div>
  );
}
