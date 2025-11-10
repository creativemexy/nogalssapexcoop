'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useWithdrawalPermission } from '@/hooks/useWithdrawalPermission';

export default function MemberWithdrawPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableBalance, setAvailableBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const { enabled: withdrawalEnabled, loading: permissionLoading } = useWithdrawalPermission('MEMBER');

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const response = await fetch('/api/member/contributions');
                const data = await response.json();
                setAvailableBalance(data.stats?.totalAmount || 0);
            } catch (error) {
                console.error('Error fetching balance:', error);
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

        if (parseFloat(amount) > availableBalance) {
            alert('Insufficient balance. Available balance: ₦' + availableBalance.toLocaleString());
            return;
        }

        if (!reason.trim()) {
            alert('Please provide a reason for withdrawal');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/member/withdraw', {
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
                router.push('/dashboard/member');
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
                        Withdrawal functionality is currently disabled for members. Please contact support if you need assistance.
                    </p>
                    <button
                        onClick={() => router.push('/dashboard/member')}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Withdrawal</h1>
                        <p className="text-gray-600">Withdraw funds from your contribution balance</p>
                    </div>

                    {/* Available Balance */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <span className="text-green-700 font-medium">Available Balance:</span>
                            <span className="text-2xl font-bold text-green-700">₦{availableBalance.toLocaleString()}</span>
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                required
                            />
                        </div>

                        {/* Terms and Conditions */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h3 className="font-medium text-yellow-800 mb-2">Important Notes:</h3>
                            <ul className="text-sm text-yellow-700 space-y-1">
                                <li>• Withdrawal requests are subject to approval by your cooperative</li>
                                <li>• Processing time is typically 3-5 business days</li>
                                <li>• You can only withdraw up to your available contribution balance</li>
                                <li>• Withdrawals may affect your loan eligibility</li>
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
        </div>
    );
}
