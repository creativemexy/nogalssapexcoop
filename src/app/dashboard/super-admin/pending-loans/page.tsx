'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loan, User } from '@prisma/client';

type LoanWithUser = Loan & {
    user: Pick<User, 'firstName' | 'lastName' | 'email'>;
};

export default function PendingLoansPage() {
    const [pendingLoans, setPendingLoans] = useState<LoanWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPendingLoans = async () => {
            try {
                const response = await fetch('/api/admin/pending-loans');
                if (!response.ok) {
                    throw new Error('Failed to fetch pending loans');
                }
                const data = await response.json();
                setPendingLoans(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPendingLoans();
    }, []);

    const handleApprove = async (loanId: string) => {
        // Placeholder for approval logic
        alert(`Loan ${loanId} approved (simulation).`);
    };
    
    const handleReject = async (loanId: string) => {
        // Placeholder for rejection logic
        alert(`Loan ${loanId} rejected (simulation).`);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Pending Loan Approvals</h1>
                <Link href="/dashboard/super-admin" className="text-blue-600 hover:text-blue-500">
                    &larr; Back to Dashboard
                </Link>
            </div>
            
            {loading && <p>Loading pending loans...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
                <div className="bg-white rounded-lg shadow">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pendingLoans.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-4">No pending loans found.</td>
                                    </tr>
                                ) : (
                                    pendingLoans.map((loan) => (
                                        <tr key={loan.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{loan.user.firstName} {loan.user.lastName}</div>
                                                <div className="text-sm text-gray-500">{loan.user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₦{Number(loan.amount).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loan.purpose}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(loan.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button onClick={() => handleApprove(loan.id)} className="text-green-600 hover:text-green-900">Approve</button>
                                                <button onClick={() => handleReject(loan.id)} className="text-red-600 hover:text-red-900">Reject</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
} 