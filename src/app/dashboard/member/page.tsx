'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';

export default function MemberDashboard() {
    const { data: session } = useSession();
    const [virtualAccount, setVirtualAccount] = useState<any>(null);
    const [savings, setSavings] = useState<number>(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cooperatives, setCooperatives] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    useEffect(() => {
        const fetchUserCooperative = async () => {
            try {
                const response = await fetch('/api/member/cooperative');
                const data = await response.json();
                if (data.cooperative) {
                    setCooperatives([data.cooperative]);
                }
            } catch (error) {
                console.error('Error fetching user cooperative:', error);
            }
        };
        fetchUserCooperative();
    }, []);

    const handleContributionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData(e.currentTarget);
            const amount = parseFloat(formData.get('amount') as string);
            const cooperativeId = formData.get('cooperativeId') as string;

            const response = await fetch('/api/member/contribute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount,
                    cooperativeId
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
                
                <div className="mt-6 mb-8">
                    <button
                        onClick={() => document.getElementById('contribution-form')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
                    >
                        💰 Make a Contribution
                    </button>
                    <p className="mt-2 text-sm text-gray-500">Click to make a contribution to your cooperative</p>
                </div>
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
                    <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-2">Contribution History</h3>
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
                                    transactions.map(contrib => (
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
                </div>
                <div id="contribution-form" className="mt-8">
                    <h2 className="text-xl font-bold text-green-700 mb-4">Make a Contribution</h2>
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <form onSubmit={handleContributionSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                                    Contribution Amount (₦)
                                </label>
                                <input
                                    type="number"
                                    id="amount"
                                    name="amount"
                                    min="100"
                                    step="100"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter amount"
                                />
                            </div>
                            <div>
                                <label htmlFor="cooperative" className="block text-sm font-medium text-gray-700 mb-2">
                                    Cooperative
                                </label>
                                {cooperatives.length > 0 ? (
                                    <select
                                        id="cooperative"
                                        name="cooperativeId"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        {cooperatives.map((coop) => (
                                            <option key={coop.id} value={coop.id}>
                                                {coop.name} ({coop.registrationNumber})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
                                        No cooperative associated with your account
                                    </div>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || cooperatives.length === 0}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Processing...' : cooperatives.length === 0 ? 'No Cooperative Available' : 'Pay with Paystack'}
                            </button>
                        </form>
                    </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-4">
                    <Link href="/dashboard/member/contributions" className="text-green-600 hover:text-green-500 px-4 py-2 border border-green-600 rounded-lg hover:bg-green-50 transition-colors">
                        View All Contributions
                    </Link>
                    <Link href="/dashboard/member/loans" className="text-green-600 hover:text-green-500 px-4 py-2 border border-green-600 rounded-lg hover:bg-green-50 transition-colors">
                        My Loans
                    </Link>
                </div>
            </div>
        </div>
    );
} 