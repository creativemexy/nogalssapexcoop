'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ContributionStats {
  totalContributions: number;
  totalAmount: number;
  averageAmount: number;
  thisMonthAmount: number;
}

interface Contribution {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface VirtualAccount {
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  customerCode: string;
  isActive: boolean;
}

export default function LeaderContributePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Stats and data
  const [stats, setStats] = useState<ContributionStats | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Contribution form
  const [amount, setAmount] = useState<number>(5000); // Default ₦5,000
  const [description, setDescription] = useState<string>('');
  const [showFeePreview, setShowFeePreview] = useState<boolean>(false);
  const [feeCalculation, setFeeCalculation] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Check for impersonation data
      const impersonationData = localStorage.getItem('impersonationData');
      const headers: Record<string, string> = {};
      
      if (impersonationData) {
        headers['x-impersonation-data'] = impersonationData;
      }

      // Fetch stats
      const statsResponse = await fetch('/api/leader/personal/contribute/stats', {
        headers
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch contributions with pagination
      const contributionsResponse = await fetch(`/api/leader/personal/contribute/history?page=${currentPage}&limit=${itemsPerPage}`, {
        headers
      });
      if (contributionsResponse.ok) {
        const contributionsData = await contributionsResponse.json();
        setContributions(contributionsData.contributions || []);
        setTotalPages(contributionsData.totalPages || 1);
      }

      // Fetch virtual account
      const virtualAccountResponse = await fetch('/api/leader/virtual-account', {
        headers
      });
      if (virtualAccountResponse.ok) {
        const virtualAccountData = await virtualAccountResponse.json();
        setVirtualAccount(virtualAccountData.virtualAccount);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };


  const calculateFees = (amount: number) => {
    const baseAmount = amount;
    let fee = 0;
    let isFeeWaived = false;
    let isFeeCapped = false;

    // 1.5% + ₦100 for all local channels
    fee = (baseAmount * 0.015);
    
    // Waive ₦100 fee for transactions under ₦2,500
    if (baseAmount < 2500) {
      isFeeWaived = true;
    } else {
      fee += 100;
    }
    
    // Cap fees at ₦2,000
    if (fee > 2000) {
      fee = 2000;
      isFeeCapped = true;
    }
    
    const totalAmount = baseAmount + fee;
    const effectiveFeePercentage = baseAmount > 0 ? ((fee / baseAmount) * 100).toFixed(2) : '0.00';

    return {
      baseAmount: parseFloat(baseAmount.toFixed(2)),
      fee: parseFloat(fee.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      isFeeWaived,
      isFeeCapped,
      feePercentage: effectiveFeePercentage
    };
  };

  const showFeePreviewModal = () => {
    if (!amount || amount < 1000) {
      setError('Minimum contribution amount is ₦1,000');
      return;
    }
    const calculation = calculateFees(amount);
    setFeeCalculation(calculation);
    setShowFeePreview(true);
  };

  const handlePaystackPayment = async () => {
    if (!amount || amount < 1000) {
      setError('Minimum contribution amount is ₦1,000');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Check for impersonation data
      const impersonationData = localStorage.getItem('impersonationData');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (impersonationData) {
        headers['x-impersonation-data'] = impersonationData;
      }

      const response = await fetch('/api/leader/personal/contribute/paystack', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: amount,
          description: description || `Leader contribution of ₦${amount.toLocaleString()}`
        })
      });

      const data = await response.json();

      if (response.ok && data.paymentUrl) {
        // Redirect to Paystack payment page
        window.location.href = data.paymentUrl;
      } else {
        setError(data.error || 'Failed to initialize payment');
      }
    } catch (err) {
      setError('Network error - unable to initialize payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Link href="/dashboard/leader" className="hover:text-gray-700">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900">Personal Contributions</span>
        </nav>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personal Contributions</h1>
          <p className="mt-2 text-gray-600">
            Manage your personal contributions to the cooperative
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Contributions</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalContributions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-semibold text-gray-900">₦{stats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Amount</p>
                <p className="text-2xl font-semibold text-gray-900">₦{stats.averageAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">₦{stats.thisMonthAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Make Contribution Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Make a Contribution</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contribution Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Contribution Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₦</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="1000"
                  step="100"
                  className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="5000"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Default amount is ₦5,000</p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Describe the purpose of this contribution..."
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={showFeePreviewModal}
                disabled={submitting || !amount || amount < 1000}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'Processing...' : 'Pay with Paystack'}
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Amount: ₦{amount.toLocaleString()} • Click "Pay with Paystack" to see fees
            </p>
          </div>

          {/* Virtual Account Info */}
          {virtualAccount && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Your Virtual Account</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-600">Bank Name:</span>
                  <span className="ml-2 text-sm text-gray-900">{virtualAccount.bankName}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Account Number:</span>
                  <span className="ml-2 text-sm text-gray-900 font-mono">{virtualAccount.accountNumber}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Account Name:</span>
                  <span className="ml-2 text-sm text-gray-900">{virtualAccount.accountName}</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                You can make direct bank transfers to this account for contributions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contributions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Contribution History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contributions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No contributions found</td>
                </tr>
              ) : (
                contributions.map((contribution) => (
                  <tr key={contribution.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(contribution.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ₦{contribution.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {contribution.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fee Preview Modal */}
      {showFeePreview && feeCalculation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Fee Breakdown</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Amount:</span>
                <span className="font-medium">₦{feeCalculation.baseAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Fee:</span>
                <span className="font-medium">₦{feeCalculation.fee.toLocaleString()}</span>
              </div>
              {feeCalculation.isFeeWaived && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  ✓ ₦100 fee waived for amounts under ₦2,500
                </div>
              )}
              {feeCalculation.isFeeCapped && (
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  ℹ Fee capped at ₦2,000 maximum
                </div>
              )}
              <hr />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="text-green-600">₦{feeCalculation.totalAmount.toLocaleString()}</span>
              </div>
              <div className="text-sm text-gray-500 text-center">
                Effective fee rate: {feeCalculation.feePercentage}%
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFeePreview(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowFeePreview(false);
                  handlePaystackPayment();
                }}
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {submitting ? 'Processing...' : 'Proceed with Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}