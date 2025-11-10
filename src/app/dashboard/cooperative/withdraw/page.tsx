'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWithdrawalPermission } from '@/hooks/useWithdrawalPermission';

interface WithdrawalData {
  availableBalance: number;
  totalAllocation: number;
  pendingAmount: number;
  allocationPercentage: number;
  withdrawals: Array<{
    id: string;
    amount: number;
    reason: string;
    status: string;
    requestedAt: string;
    processedAt?: string;
    notes?: string;
  }>;
}

export default function CooperativeWithdrawPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [withdrawalData, setWithdrawalData] = useState<WithdrawalData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { enabled: withdrawalEnabled, loading: permissionLoading } = useWithdrawalPermission('COOPERATIVE');

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const response = await fetch('/api/cooperative/withdraw');
                if (!response.ok) {
                    throw new Error('Failed to fetch withdrawal data');
                }
                const data = await response.json();
                setWithdrawalData(data);
            } catch (error) {
                console.error('Error fetching balance:', error);
                setError('Failed to load withdrawal data');
            } finally {
                setLoading(false);
            }
        };
        fetchBalance();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (!withdrawalData) {
            alert('Unable to fetch balance. Please refresh the page.');
            return;
        }

        if (parseFloat(amount) > withdrawalData.availableBalance) {
            alert(`Insufficient balance. Available balance: ₦${withdrawalData.availableBalance.toLocaleString()}`);
            return;
        }

        if (!reason.trim()) {
            alert('Please provide a reason for withdrawal');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/cooperative/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    reason: reason.trim()
                }),
            });

            const data = await response.json();

            if (data.success) {
                alert('Withdrawal request submitted successfully! You will be notified when it is processed.');
                // Refresh the data
                const refreshResponse = await fetch('/api/cooperative/withdraw');
                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    setWithdrawalData(refreshData);
                }
                setAmount('');
                setReason('');
            } else {
                alert(data.error || 'Failed to submit withdrawal request');
            }
        } catch (error) {
            console.error('Error submitting withdrawal:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

  if (loading || permissionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!withdrawalEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Withdrawals Disabled</h2>
          <p className="text-gray-600 mb-6">
            Withdrawal functionality is currently disabled for cooperatives. Please contact support if you need assistance.
          </p>
          <button
            onClick={() => router.push('/dashboard/cooperative')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

    if (error && !withdrawalData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-4">Error</div>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const availableBalance = withdrawalData?.availableBalance || 0;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                        <Link href="/dashboard/cooperative" className="hover:text-gray-700">
                            Dashboard
                        </Link>
                        <span>/</span>
                        <span className="text-gray-900">Withdraw Allocation</span>
                    </nav>
                    <h1 className="text-3xl font-bold text-gray-900">Withdraw Allocation Balance</h1>
                    <p className="mt-2 text-gray-600">Withdraw funds from your cooperative allocation balance</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Withdrawal Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            {/* Balance Information */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-green-700 font-medium">Total Allocation ({withdrawalData?.allocationPercentage || 20}%):</span>
                                        <span className="text-xl font-bold text-green-700">₦{(withdrawalData?.totalAllocation || 0).toLocaleString()}</span>
                                    </div>
                                    {withdrawalData && withdrawalData.pendingAmount > 0 && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-green-600">Pending Withdrawals:</span>
                                            <span className="text-green-600">₦{withdrawalData.pendingAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-green-200 pt-2 flex items-center justify-between">
                                        <span className="text-green-800 font-semibold">Available Balance:</span>
                                        <span className="text-2xl font-bold text-green-800">₦{availableBalance.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Amount */}
                                <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                                        Withdrawal Amount (₦)
                                    </label>
                                    <input
                                        type="number"
                                        id="amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Enter amount to withdraw"
                                        min="1"
                                        max={availableBalance}
                                        step="0.01"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black"
                                        required
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Maximum: ₦{availableBalance.toLocaleString()}
                                    </p>
                                </div>

                                {/* Reason */}
                                <div>
                                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason for Withdrawal
                                    </label>
                                    <textarea
                                        id="reason"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Please provide a reason for this withdrawal request..."
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-black"
                                        required
                                    />
                                </div>

                                {/* Terms and Conditions */}
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h3 className="font-medium text-yellow-800 mb-2">Important Notes:</h3>
                                    <ul className="text-sm text-yellow-700 space-y-1">
                                        <li>• Withdrawal requests are subject to approval by administrators</li>
                                        <li>• Processing time is typically 3-5 business days</li>
                                        <li>• You can only withdraw up to your available allocation balance</li>
                                        <li>• Allocation is calculated as {withdrawalData?.allocationPercentage || 20}% of registration fees from your members</li>
                                    </ul>
                                </div>

                                {/* Submit Button */}
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || availableBalance === 0}
                                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Withdrawal Request'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Withdrawal History */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Withdrawals</h2>
                            {withdrawalData && withdrawalData.withdrawals.length > 0 ? (
                                <div className="space-y-4">
                                    {withdrawalData.withdrawals.map((withdrawal) => (
                                        <div key={withdrawal.id} className="border-b border-gray-200 pb-4 last:border-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-semibold text-gray-900">₦{withdrawal.amount.toLocaleString()}</span>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(withdrawal.status)}`}>
                                                    {withdrawal.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1">{withdrawal.reason}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(withdrawal.requestedAt).toLocaleDateString()}
                                            </p>
                                            {withdrawal.notes && (
                                                <p className="text-xs text-gray-500 mt-1 italic">Note: {withdrawal.notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No withdrawal history yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}




