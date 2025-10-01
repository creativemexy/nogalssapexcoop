'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';

interface UserSession {
  id: string;
  userId: string;
  user: { email: string; firstName: string; lastName: string; role: string };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  expiresAt: string;
}

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  timestamp: string;
}

export default function UserActivityDashboard() {
  const { data: session, status } = useSession();
  const socket = useSocket();
  const [activeUsers, setActiveUsers] = useState<UserSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    if (socket) {
      socket.on('user:activity', fetchData);
      return () => { socket.off('user:activity', fetchData); };
    }
  }, [socket]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionsRes, logsRes] = await Promise.all([
        fetch('/api/admin/sessions'),
        fetch('/api/admin/security/audit'),
      ]);
      const sessionsData = await sessionsRes.json();
      const logsData = await logsRes.json();
      setActiveUsers(sessionsData.sessions || []);
      setAuditLogs((logsData.logs || []).slice(0, 50));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activity data');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin h-10 w-10 border-b-2 border-green-600 rounded-full"></div></div>;
  }
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="text-center"><h2 className="text-2xl font-bold text-red-600">Access Denied</h2><p className="text-gray-600 dark:text-gray-300">You do not have permission to view this page.</p></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">User Activity Monitoring</h1>
      {error && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
      {loading && <div className="mb-4 text-gray-600 dark:text-gray-300">Loading...</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-900 rounded shadow p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Active Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr>
                  <th className="px-2 py-1 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">Email</th>
                  <th className="px-2 py-1 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">Name</th>
                  <th className="px-2 py-1 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">Role</th>
                  <th className="px-2 py-1 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">IP</th>
                  <th className="px-2 py-1 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">Started</th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-2 py-1 border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200">{u.user?.email}</td>
                    <td className="px-2 py-1 border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200">{u.user?.firstName} {u.user?.lastName}</td>
                    <td className="px-2 py-1 border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200">{u.user?.role}</td>
                    <td className="px-2 py-1 border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200">{u.ipAddress || '-'}</td>
                    <td className="px-2 py-1 border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200">{new Date(u.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded shadow p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Recent User Actions</h2>
          <div className="overflow-y-auto max-h-[500px]">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {auditLogs.map((log) => (
                <li key={log.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{log.userEmail}</span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{log.action}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
