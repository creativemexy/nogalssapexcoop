'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import RegistrationFeeCard from '@/components/RegistrationFeeCard';
import { useSocket } from '@/hooks/useSocket';

export default function LeaderDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<{ totalMembers: number; totalContributions: number; pendingLoans: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError(null);
            try {
                // Check for impersonation data
                const impersonationData = localStorage.getItem('impersonationData');
                const headers: Record<string, string> = {};
                
                if (impersonationData) {
                    headers['x-impersonation-data'] = impersonationData;
                }
                
                const res = await fetch('/api/leader/dashboard-stats', {
                    headers
                });
                if (!res.ok) throw new Error('Failed to fetch stats');
                const data = await res.json();
                setStats(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col items-center mb-6">
                <Image src="/logo.png" alt="Nogalss Logo" width={96} height={96} priority />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Leader Dashboard</h1>
            <RegistrationFeeCard canEdit={false} showTitle />
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                </div>
            ) : error ? (
                <div className="text-red-600 text-center font-semibold py-8">{error}</div>
            ) : stats && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard title="Total Members" value={stats.totalMembers} color="green" />
                        <StatCard title="Total Contributions" value={stats.totalContributions} color="yellow" isCurrency />
                        <StatCard title="Pending Loans" value={stats.pendingLoans} color="green" />
                    </div>
                    {/* Leader's Personal Section */}
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Personal Account</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-green-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-green-800 mb-2">Your Allocations</h3>
                                <p className="text-green-700">View your 20% share of registration fees from your cooperative members</p>
                                <Link href="/dashboard/leader/allocations" className="inline-block mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                    View Allocations
                                </Link>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-blue-800 mb-2">Personal Services</h3>
                                <p className="text-blue-700">Make contributions, apply for loans, and manage investments as a cooperative member</p>
                                <div className="mt-3 space-x-2">
                                    <Link href="/dashboard/leader/personal/contribute" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                        Make Contribution
                                    </Link>
                                    <Link href="/dashboard/leader/personal/apply-loan" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                        Apply for Loan
                                    </Link>
                                    <Link href="/dashboard/leader/personal/investment" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                                        Investment
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Management Actions */}
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Cooperative Management</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <ActionCard title="Manage Members" description="View and manage all co-operative members" href="/dashboard/leader/members" />
                            <ActionCard title="View Contributions" description="See all member contributions" href="/dashboard/leader/contributions" />
                            <ActionCard title="Approve Loans" description="Review and approve loan applications" href="/dashboard/leader/loans" />
                            <ActionCard title="2FA Security" description="Set up two-factor authentication" href="/dashboard/2fa-setup" />
                        </div>
                    </div>
                </>
            )}
            <div className="bg-white rounded-lg shadow p-8">
                <p className="text-gray-600">Welcome, {session?.user?.name}.</p>
                <p className="mt-4 text-gray-600">This is your dashboard for managing your co-operative. Use the quick actions above to get started.</p>
            </div>
        </div>
    );
}

const StatCard = ({ title, value, color, isCurrency }: { title: string; value: number; color: 'green' | 'yellow'; isCurrency?: boolean }) => (
    <div className={`bg-white rounded-lg shadow p-6 border-t-4 ${color === 'green' ? 'border-green-500' : 'border-yellow-500'}`}>
        <p className={`text-sm font-medium ${color === 'green' ? 'text-green-700' : 'text-yellow-700'}`}>{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{isCurrency ? `₦${value.toLocaleString()}` : value}</p>
    </div>
);

const ActionCard = ({ title, description, href }: { title: string; description: string; href: string }) => (
    <Link href={href} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500 block">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
    </Link>
); 