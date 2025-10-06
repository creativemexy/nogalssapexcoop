'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SessionStats {
  totalActiveSessions: number;
  totalUsers: number;
  averageSessionsPerUser: number;
}

interface UserSession {
  id: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
}

export default function SessionManagementPage() {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionStats();
  }, []);

  const fetchSessionStats = async () => {
    try {
      const response = await fetch('/api/admin/sessions');
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      } else {
        setError(data.error || 'Failed to fetch session stats');
      }
    } catch (err) {
      setError('Failed to fetch session stats');
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidateAllSessions = async () => {
    if (!confirm('Are you sure you want to invalidate all active sessions? This will log out all users.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/sessions?action=invalidateAll', { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        alert(`Invalidated ${data.invalidatedSessions} sessions`);
        fetchSessionStats();
      } else {
        alert(data.error || 'Failed to invalidate sessions');
      }
    } catch (err) {
      alert('Failed to invalidate sessions');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
        <Link href="/dashboard/super-admin" className="text-green-600 hover:text-green-500">
          &larr; Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* Session Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.totalActiveSessions || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.totalUsers || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Sessions/User</p>
                  <p className="text-2xl font-semibold text-gray-900">{(stats?.averageSessionsPerUser || 0).toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Session Management Actions */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Session Management</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Session Timeout</h3>
                  <p className="text-sm text-gray-600">Current timeout: 30 minutes</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Concurrent Session Limit</h3>
                  <p className="text-sm text-gray-600">Maximum 3 sessions per user</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Enforced
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <h3 className="text-lg font-medium text-red-900">Emergency Session Invalidation</h3>
                  <p className="text-sm text-red-600">This will log out all users immediately</p>
                </div>
                <button
                  onClick={handleInvalidateAllSessions}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Invalidate All Sessions
                </button>
              </div>
            </div>
          </div>

          {/* Session Security Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Security Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">Session Timeout</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Sessions expire after 30 minutes of inactivity</li>
                  <li>• Automatic cleanup of expired sessions</li>
                  <li>• Users must re-authenticate after timeout</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">Concurrent Sessions</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Maximum 3 active sessions per user</li>
                  <li>• Oldest sessions are automatically invalidated</li>
                  <li>• Prevents session hijacking and abuse</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

