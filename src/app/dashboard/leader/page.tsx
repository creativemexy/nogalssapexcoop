'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import RegistrationFeeCard from '@/components/RegistrationFeeCard';

export default function LeaderDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<{ totalMembers: number; totalContributions: number; pendingLoans: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/leader/dashboard-stats');
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
                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <ActionCard title="Manage Members" description="View and manage all co-operative members" href="/dashboard/leader/members" />
                        <ActionCard title="View Contributions" description="See all member contributions" href="/dashboard/leader/contributions" />
                        <ActionCard title="Approve Loans" description="Review and approve loan applications" href="/dashboard/leader/loans" />
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