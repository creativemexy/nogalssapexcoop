'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function MemberDashboard() {
    const { data: session } = useSession();
    const [virtualAccount, setVirtualAccount] = useState<any>(null);
    const [savings, setSavings] = useState<number>(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const va = localStorage.getItem('virtualAccountInfo');
            if (va) setVirtualAccount(JSON.parse(va));
        }
    }, []);

    useEffect(() => {
        const fetchSavings = async () => {
            setLoading(true);
            const res = await fetch('/api/member/savings');
            const data = await res.json();
            setSavings(data.totalSavings);
            setTransactions(data.transactions);
            setLoading(false);
        };
        fetchSavings();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col items-center mb-6">
                <Image src="/logo.png" alt="Nogalss Logo" width={120} height={120} className="mb-2" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Member Dashboard</h1>
            <div className="bg-white rounded-lg shadow p-8">
                <p className="text-gray-600">Welcome, {session?.user?.name}.</p>
                <p className="mt-4 text-gray-600">This is your personal dashboard. Here you can view your contributions, apply for loans, and see your transaction history.</p>
                {virtualAccount && (
                    <div className="mt-8 p-6 rounded-lg border border-green-200 bg-green-50">
                        <h2 className="text-lg font-bold text-green-700 mb-2">Your Virtual Account</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <span className="block text-xs text-gray-500">Bank Name</span>
                                <span className="font-semibold text-green-800">{virtualAccount.bank?.name || virtualAccount.bank}</span>
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
                    </div>
                )}
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-green-700 mb-2">Total Savings</h2>
                    {loading ? (
                        <div className="text-gray-500">Loading...</div>
                    ) : (
                        <div className="text-3xl font-bold text-green-700 mb-4">₦{savings.toLocaleString()}</div>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-2">Transaction History</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-green-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase">Amount</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-green-700 uppercase">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-4 text-center text-gray-400">No transactions found.</td>
                                    </tr>
                                ) : (
                                    transactions.map(tx => (
                                        <tr key={tx.reference}>
                                            <td className="px-4 py-2 whitespace-nowrap">{new Date(tx.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">₦{tx.amount.toLocaleString()}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                {tx.status === 'SUCCESSFUL' ? (
                                                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">Successful</span>
                                                ) : (
                                                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded">{tx.status}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">{tx.reference}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="mt-6">
                    <Link href="/dashboard/member/contributions" className="text-green-600 hover:text-green-500 mr-4">
                        My Contributions
                    </Link>
                    <Link href="/dashboard/member/loans" className="text-green-600 hover:text-green-500">
                        My Loans
                    </Link>
                </div>
            </div>
        </div>
    );
} 