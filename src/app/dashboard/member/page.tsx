'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { calculateTransactionFees, formatFeeBreakdown, FeeCalculation } from '@/lib/fee-calculator';

export default function MemberDashboard() {
    const { data: session } = useSession();
    const [virtualAccount, setVirtualAccount] = useState<any>(null);
    const [savings, setSavings] = useState<number>(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cooperatives, setCooperatives] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [memberAmount, setMemberAmount] = useState<number>(0);
    const [showFeePreview, setShowFeePreview] = useState(false);
    const [feeCalculation, setFeeCalculation] = useState<FeeCalculation | null>(null);

    useEffect(() => {
        const fetchVirtualAccount = async () => {
            try {
                const response = await fetch('/api/member/virtual-account');
                const data = await response.json();
                if (data.virtualAccount) {
                    setVirtualAccount(data.virtualAccount);
                }
            } catch (error) {
                console.error('Error fetching virtual account:', error);
            }
        };
        fetchVirtualAccount();
    }, []);

    useEffect(() => {
        const fetchContributions = async () => {
            setLoading(true);
            const res = await fetch('/api/member/contributions');
            const data = await res.json();
            setSavings(data.stats?.totalAmount || 0);
            setTransactions(data.contributions || []);
            setLoading(false);
        };
        fetchContributions();
    }, []);

    // Check for payment verification on page load
    useEffect(() => {
        const verifyPayment = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const reference = urlParams.get('reference');
            const type = urlParams.get('type');
            
            if (reference && type === 'contribution') {
                try {
                    console.log('🔍 Verifying contribution payment:', reference);
                    const response = await fetch(`/api/payments/verify?reference=${reference}`);
                    
                    if (response.ok) {
                        console.log('✅ Payment verification successful');
                        // Refresh contributions after successful verification
                        const res = await fetch('/api/member/contributions');
                        const data = await res.json();
                        setSavings(data.stats?.totalAmount || 0);
                        setTransactions(data.contributions || []);
                        
                        // Clean up URL parameters
                        window.history.replaceState({}, document.title, window.location.pathname);
                    } else {
                        console.error('❌ Payment verification failed');
                    }
                } catch (error) {
                    console.error('Error verifying payment:', error);
                }
            }
        };

        verifyPayment();
    }, []);

    useEffect(() => {
        const fetchUserCooperative = async () => {
            try {
                const response = await fetch('/api/member/cooperative');
                const data = await response.json();
                if (data.cooperative) {
                    setCooperatives([data.cooperative]);
                    // Set default amount from member's registration (you can adjust this logic)
                    setMemberAmount(data.memberAmount || 1000); // Default to 1000 if not specified
                }
            } catch (error) {
                console.error('Error fetching user cooperative:', error);
            }
        };
        fetchUserCooperative();
    }, []);

    const showFeePreviewModal = () => {
        if (memberAmount <= 0) {
            alert('Please set a valid contribution amount first');
            return;
        }
        
        const calculation = calculateTransactionFees(memberAmount);
        setFeeCalculation(calculation);
        setShowFeePreview(true);
    };

    const handleDirectContribution = async () => {
        if (cooperatives.length === 0) {
            alert('No cooperative associated with your account');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/member/contribute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: memberAmount,
                    cooperativeId: cooperatives[0].id
                }),
            });

            const data = await response.json();

            if (data.success && data.paymentUrl) {
                // Redirect to Paystack payment page
                window.location.href = data.paymentUrl;
            } else {
                alert(data.error || 'Failed to initialize payment');
            }
        } catch (error) {
            console.error('Error submitting contribution:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const socket = useSocket();
    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            // TODO: Call your data refresh function here
            // fetchDashboardStats();
        };
        socket.on('dashboard:update', handleUpdate);
        return () => {
            socket.off('dashboard:update', handleUpdate);
        };
    }, [socket]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col items-center mb-6">
                <Image src="/logo.png" alt="Nogalss Logo" width={120} height={120} className="mb-2" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Member Dashboard</h1>
            <div className="bg-white rounded-lg shadow p-8">
                <p className="text-gray-600">Welcome, {session?.user?.name}.</p>
                <p className="mt-4 text-gray-600">This is your personal dashboard. Here you can view your contributions, apply for loans, and see your transaction history.</p>
                
                {virtualAccount ? (
                    <div className="mt-8 p-6 rounded-lg border border-green-200 bg-green-50">
                        <h2 className="text-lg font-bold text-green-700 mb-2">Your Virtual Account</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <span className="block text-xs text-gray-500">Bank Name</span>
                                <span className="font-semibold text-green-800">{virtualAccount.bankName}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">Account Number</span>
                                <span className="font-semibold text-green-800">{virtualAccount.accountNumber}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-500">Account Name</span>
                                <span className="font-semibold text-green-800">{virtualAccount.accountName}</span>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-green-100 rounded">
                            <p className="text-sm text-green-700">
                                <strong>Note:</strong> Use this virtual account number to make contributions to your cooperative. 
                                All deposits to this account will be automatically credited to your cooperative account.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="mt-8 p-6 rounded-lg border border-yellow-200 bg-yellow-50">
                        <h2 className="text-lg font-bold text-yellow-700 mb-2">Virtual Account</h2>
                        <p className="text-yellow-700">
                            Your virtual account is being set up. Please check back later or contact support if this persists.
                        </p>
                    </div>
                )}
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-green-700 mb-2">Total Contributions</h2>
                    {loading ? (
                        <div className="text-gray-500">Loading...</div>
                    ) : (
                        <div className="text-3xl font-bold text-green-700 mb-4">₦{savings.toLocaleString()}</div>
                    )}
                    <div className="flex justify-between items-center mt-8 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">Contribution History</h3>
                        <span className="text-sm text-gray-500">Showing last 3 contributions</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-green-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase">Amount</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase">Cooperative</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase">Description</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-4 text-center text-gray-400">No contributions found.</td>
                                    </tr>
                                ) : (
                                    transactions.slice(0, 3).map(contrib => (
                                        <tr key={contrib.id}>
                                            <td className="px-4 py-2 whitespace-nowrap">{new Date(contrib.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">₦{contrib.amount.toLocaleString()}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <div className="text-sm">
                                                    <div className="font-medium">{contrib.cooperative.name}</div>
                                                    <div className="text-gray-500">{contrib.cooperative.registrationNumber}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">{contrib.description || 'Contribution'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {transactions.length > 3 && (
                        <div className="mt-4 text-center">
                            <Link 
                                href="/dashboard/member/contributions" 
                                className="text-green-600 hover:text-green-500 text-sm font-medium"
                            >
                                View All Contributions ({transactions.length} total) →
                            </Link>
                        </div>
                    )}
                </div>
                {/* Action Buttons */}
                <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Make Contribution Button */}
                        <div className="space-y-2">
                            <button
                                onClick={showFeePreviewModal}
                                disabled={isSubmitting || cooperatives.length === 0}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center w-full"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                💰 Make a Contribution
                            </button>
                            <p className="text-xs text-gray-500 text-center">
                                Amount: ₦{memberAmount.toLocaleString()} • Click to see fees
                            </p>
                        </div>

                        {/* Withdrawal Button */}
                        <Link 
                            href="/dashboard/member/withdraw"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4m16 0l-4-4m4 4l-4 4" />
                            </svg>
                            💸 Request Withdrawal
                        </Link>

                        {/* Apply for Loan Button */}
                        <Link 
                            href="/dashboard/member/apply-loan"
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            📋 Apply for Loan
                        </Link>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="mt-6 flex flex-wrap gap-4">
                    <Link href="/dashboard/member/contributions" className="text-green-600 hover:text-green-500 px-4 py-2 border border-green-600 rounded-lg hover:bg-green-50 transition-colors">
                        View All Contributions
                    </Link>
                    <Link href="/dashboard/member/loans" className="text-green-600 hover:text-green-500 px-4 py-2 border border-green-600 rounded-lg hover:bg-green-50 transition-colors">
                        My Loans
                    </Link>
                    <Link href="/dashboard/member/withdrawals" className="text-blue-600 hover:text-blue-500 px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                        My Withdrawals
                    </Link>
                </div>
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
                                    handleDirectContribution();
                                }}
                                disabled={isSubmitting}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                {isSubmitting ? 'Processing...' : 'Proceed with Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 