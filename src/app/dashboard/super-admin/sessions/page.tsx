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
  userId: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  lastActivityAt?: string;
  createdAt: string;
  expiresAt: string;
}

interface SessionActivity {
  id: string;
  sessionId: string;
  userId: string;
  action: string;
  resource?: string;
  method?: string;
  ipAddress?: string;
  userAgent?: string;
  riskLevel: string;
  createdAt: string;
  metadata?: any;
}

export default function SessionManagementPage() {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cleanupStats, setCleanupStats] = useState<any>(null);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [activities, setActivities] = useState<SessionActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activityStats, setActivityStats] = useState<any>(null);

  useEffect(() => {
    fetchSessionStats();
    fetchCleanupStats();
    fetchActivityStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSessionStats();
      fetchCleanupStats();
      fetchActivityStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchSessionActivities(selectedSession);
    }
  }, [selectedSession]);

  const fetchSessionStats = async () => {
    try {
      const response = await fetch('/api/admin/sessions');
      const data = await response.json();
      if (response.ok) {
        setStats({
          totalActiveSessions: data.totalActiveSessions,
          totalUsers: data.totalUsers,
          averageSessionsPerUser: data.averageSessionsPerUser,
        });
        setSessions(data.sessions || []);
      } else {
        setError(data.error || 'Failed to fetch session stats');
      }
    } catch (err) {
      setError('Failed to fetch session stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchCleanupStats = async () => {
    try {
      const response = await fetch('/api/admin/sessions/cleanup');
      if (response.ok) {
        const data = await response.json();
        setCleanupStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch cleanup stats:', err);
    }
  };

  const fetchActivityStats = async () => {
    try {
      const response = await fetch('/api/admin/sessions/activity/stats');
      if (response.ok) {
        const data = await response.json();
        setActivityStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch activity stats:', err);
    }
  };

  const fetchSessionActivities = async (sessionId: string) => {
    setLoadingActivities(true);
    try {
      const response = await fetch(`/api/admin/sessions/activity?sessionId=${sessionId}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Failed to fetch session activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleCleanupSessions = async () => {
    setCleaningUp(true);
    try {
      const response = await fetch('/api/admin/sessions/cleanup', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        setLastCleanup(new Date().toLocaleString());
        alert(`Cleanup completed: ${data.expiredSessionsCleaned} expired sessions cleaned, ${data.excessSessionsInvalidated} excess sessions invalidated`);
        fetchSessionStats();
        fetchCleanupStats();
      } else {
        alert(data.error || 'Failed to cleanup sessions');
      }
    } catch (err) {
      alert('Failed to cleanup sessions');
    } finally {
      setCleaningUp(false);
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
        fetchCleanupStats();
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
                  {cleanupStats && (
                    <p className="text-xs text-gray-500 mt-1">
                      {cleanupStats.expiredSessions || 0} expired sessions pending cleanup
                    </p>
                  )}
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Enforced
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Automatic Cleanup</h3>
                  <p className="text-sm text-gray-600">Clean up expired sessions and enforce limits</p>
                  {lastCleanup && (
                    <p className="text-xs text-gray-500 mt-1">Last cleanup: {lastCleanup}</p>
                  )}
                </div>
                <button
                  onClick={handleCleanupSessions}
                  disabled={cleaningUp}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cleaningUp ? 'Cleaning...' : 'Run Cleanup Now'}
                </button>
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
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Sessions expire after 30 minutes of inactivity</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Automatic cleanup of expired sessions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Users must re-authenticate after timeout</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Session validation on every request</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">Concurrent Sessions</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Maximum 3 active sessions per user</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Oldest sessions are automatically invalidated</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Prevents session hijacking and abuse</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Enforced on login and session validation</span>
                  </li>
                </ul>
              </div>
            </div>
            {cleanupStats && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-2">Cleanup Statistics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Active Sessions:</span>
                    <span className="ml-2 font-semibold text-gray-900">{cleanupStats.activeSessions || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Expired Sessions:</span>
                    <span className="ml-2 font-semibold text-gray-900">{cleanupStats.expiredSessions || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Sessions List with IP and User Agent */}
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4">Active Sessions</h2>
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active sessions</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {session.user
                              ? `${session.user.firstName} ${session.user.lastName}`
                              : 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.user?.email || session.userId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {session.user?.role || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-mono">
                            {session.ipAddress || (
                              <span className="text-gray-400 italic">Not available</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={session.userAgent || ''}>
                            {session.userAgent ? (
                              session.userAgent.length > 50
                                ? `${session.userAgent.substring(0, 50)}...`
                                : session.userAgent
                            ) : (
                              <span className="text-gray-400 italic">Not available</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {session.lastActivityAt
                            ? new Date(session.lastActivityAt).toLocaleString()
                            : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(session.expiresAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedSession(selectedSession === session.sessionId ? null : session.sessionId)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              {selectedSession === session.sessionId ? 'Hide' : 'View'} Activity
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm('Are you sure you want to invalidate this session?')) {
                                  return;
                                }
                                try {
                                  const response = await fetch(
                                    `/api/admin/sessions?sessionId=${session.sessionId}`,
                                    { method: 'DELETE' }
                                  );
                                  const data = await response.json();
                                  if (response.ok) {
                                    alert('Session invalidated successfully');
                                    fetchSessionStats();
                                  } else {
                                    alert(data.error || 'Failed to invalidate session');
                                  }
                                } catch (err) {
                                  alert('Failed to invalidate session');
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Invalidate
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity Statistics */}
          {activityStats && (
            <div className="bg-white rounded-lg shadow p-6 mt-8">
              <h2 className="text-xl font-semibold mb-4">Activity Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">By Risk Level</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Critical:</span>
                      <span className="font-semibold text-red-600">{activityStats.byRiskLevel?.CRITICAL || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">High:</span>
                      <span className="font-semibold text-orange-600">{activityStats.byRiskLevel?.HIGH || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Medium:</span>
                      <span className="font-semibold text-yellow-600">{activityStats.byRiskLevel?.MEDIUM || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Low:</span>
                      <span className="font-semibold text-green-600">{activityStats.byRiskLevel?.LOW || 0}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Total Activities</h3>
                  <p className="text-3xl font-bold text-gray-900">{activityStats.total || 0}</p>
                </div>
              </div>
              {activityStats.recentCritical && activityStats.recentCritical.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Critical Activities</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {activityStats.recentCritical.map((activity: any) => (
                      <div key={activity.id} className="p-3 bg-red-50 rounded border border-red-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-red-900">{activity.action}</p>
                            <p className="text-sm text-red-700">{activity.resource || 'N/A'}</p>
                            <p className="text-xs text-red-600 mt-1">
                              {new Date(activity.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium bg-red-200 text-red-800 rounded">
                            {activity.riskLevel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Session Activities */}
          {selectedSession && (
            <div className="bg-white rounded-lg shadow p-6 mt-8">
              <h2 className="text-xl font-semibold mb-4">Session Activities</h2>
              {loadingActivities ? (
                <p className="text-gray-500 text-center py-8">Loading activities...</p>
              ) : activities.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No activities found for this session</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {activity.action}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={activity.resource || ''}>
                            {activity.resource || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {activity.method || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              activity.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              activity.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              activity.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {activity.riskLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(activity.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

