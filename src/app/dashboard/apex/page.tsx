'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import RegistrationFeeCard from '@/components/RegistrationFeeCard';
import { useSocket } from '@/hooks/useSocket';

interface ApexDashboardStats {
  totalUsers: number;
  totalCooperatives: number;
  totalTransactions: number;
  pendingLoans: number;
  totalContributions: number;
  totalLoans: number;
}

export default function ApexDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<ApexDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();

  useEffect(() => {
    const fetchApexStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/apex/dashboard-stats');
        if (!res.ok) throw new Error('Failed to fetch dashboard stats');
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Error loading stats');
      } finally {
        setLoading(false);
      }
    };
    fetchApexStats();
  }, []);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Apex Dashboard</h1>
      <RegistrationFeeCard canEdit showTitle />
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Users" value={stats?.totalUsers} color="green" />
        <StatCard title="Total Cooperatives" value={stats?.totalCooperatives} color="yellow" />
        <StatCard title="Total Transactions" value={stats?.totalTransactions} color="green" />
        <StatCard title="Pending Loans" value={stats?.pendingLoans} color="yellow" />
        <StatCard title="Total Contributions" value={stats?.totalContributions} color="green" isCurrency />
        <StatCard title="Total Loans" value={stats?.totalLoans} color="yellow" isCurrency />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <ActionCard title="Manage Leaders" description="Oversee and manage leaders" href="/dashboard/apex/leaders" />
        <ActionCard title="View Cooperatives" description="Monitor all cooperatives" href="/dashboard/apex/cooperatives" />
        <ActionCard title="Approve Loans" description="Review and approve loan applications" href="/dashboard/apex/loans" />
        <ActionCard title="Generate Reports" description="Create and view reports" href="/dashboard/apex/reports" />
        <ActionCard title="Manage Events" description="Create, edit, and manage events" href="/dashboard/apex/events" />
        <ActionCard title="Registration Fee" description="Set and manage registration fees" href="/dashboard/apex/settings/registration-fee" />
        <ActionCard title="2FA Security" description="Set up two-factor authentication" href="/dashboard/2fa-setup" />
      </div>

      {/*
        // SUGGESTED ENDPOINTS FOR FUTURE FEATURES:
        // - /api/apex/recent-activities: List of recent actions/changes
        // - /api/apex/top-cooperatives: Top performing cooperatives
        // - /api/apex/recent-loans: Recent loan applications/approvals
        // - /api/apex/notifications: System notifications for Apex
      */}
    </div>
  );
}

const StatCard = ({ title, value, color, isCurrency }: { title: string; value?: number; color: 'green' | 'yellow'; isCurrency?: boolean }) => (
  <div className={`bg-white rounded-lg shadow p-6 border-t-4 ${color === 'green' ? 'border-green-500' : 'border-yellow-500'}`}>
    <p className={`text-sm font-medium ${color === 'green' ? 'text-green-700' : 'text-yellow-700'}`}>{title}</p>
    <p className="text-2xl font-semibold text-gray-900">{isCurrency ? `₦${value?.toLocaleString() ?? 0}` : value ?? 0}</p>
  </div>
);

const ActionCard = ({ title, description, href }: { title: string; description: string; href: string }) => (
  <Link href={href} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </Link>
); 