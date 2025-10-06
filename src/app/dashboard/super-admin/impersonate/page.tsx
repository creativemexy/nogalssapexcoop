'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  roleCounts: Record<string, number>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UsersResponse {
  users: User[];
  total: number;
  pagination: PaginationInfo;
  error?: string;
}

export default function ImpersonatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [impersonating, setImpersonating] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (session?.user && (session.user as any).role === 'SUPER_ADMIN') {
      fetchUsers(1);
      fetchStats();
    }
  }, [session]);

  // Refetch users when search term or role filter changes
  useEffect(() => {
    if (session?.user && (session.user as any).role === 'SUPER_ADMIN') {
      fetchUsers(1);
    }
  }, [searchTerm, roleFilter]);

  const fetchUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter }),
      });
      
      const response = await fetch(`/api/admin/users?${params}`);
      const data: UsersResponse = await response.json();
      
      if (response.ok) {
        setUsers(data.users || []);
        setPagination(data.pagination);
        setCurrentPage(page);
      } else {
        console.error('Error fetching users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/users/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const startImpersonation = async (userId: string) => {
    try {
      setImpersonating(true);
      
      // Get CSRF token for update-session
      const csrfResponse = await fetch('/api/auth/csrf');
      const { csrfToken } = await csrfResponse.json();

      // First, get the target user's session data
      const sessionResponse = await fetch('/api/admin/impersonate/update-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ targetUserId: userId }),
      });

      if (!sessionResponse.ok) {
        const error = await sessionResponse.json();
        alert(`Error: ${error.error}`);
        return;
      }

      const sessionData = await sessionResponse.json();
      
      // Log the impersonation action (reuse the same CSRF token)
      const logResponse = await fetch('/api/admin/impersonate/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ targetUserId: userId, reason: 'Admin impersonation' }),
      });

      if (logResponse.ok) {
        const userDisplayName = `${sessionData.targetUser.firstName} ${sessionData.targetUser.lastName}`;
        alert(`Impersonating ${userDisplayName} (${sessionData.targetUser.email}). You will be redirected to their dashboard.`);
        
        // Store impersonation data in localStorage for session handling
        localStorage.setItem('impersonationData', JSON.stringify(sessionData.targetUser));
        
        // Redirect to the appropriate dashboard based on role
        const role = sessionData.targetUser.role;
        switch (role) {
          case 'FINANCE':
            router.push('/dashboard/finance');
            break;
          case 'APEX_FUNDS':
            router.push('/dashboard/apex-funds');
            break;
          case 'NOGALSS_FUNDS':
            router.push('/dashboard/nogalss-funds');
            break;
          case 'APEX':
            router.push('/dashboard/apex');
            break;
          case 'LEADER':
            router.push('/dashboard/leader');
            break;
          case 'COOPERATIVE':
            router.push('/dashboard/organization');
            break;
          case 'MEMBER':
            router.push('/dashboard/member');
            break;
          default:
            router.push('/dashboard');
        }
      } else {
        const error = await logResponse.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error starting impersonation:', error);
      alert('Error starting impersonation');
    } finally {
      setImpersonating(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (pagination?.pages || 1)) {
      fetchUsers(page);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'SUPER_ADMIN': 'bg-red-100 text-red-800',
      'APEX': 'bg-blue-100 text-blue-800',
      'FINANCE': 'bg-green-100 text-green-800',
      'APEX_FUNDS': 'bg-purple-100 text-purple-800',
      'NOGALSS_FUNDS': 'bg-indigo-100 text-indigo-800',
      'LEADER': 'bg-yellow-100 text-yellow-800',
      'COOPERATIVE': 'bg-orange-100 text-orange-800',
      'MEMBER': 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getDashboardUrl = (role: string) => {
    const urls: Record<string, string> = {
      'FINANCE': '/dashboard/finance',
      'APEX_FUNDS': '/dashboard/apex-funds',
      'NOGALSS_FUNDS': '/dashboard/nogalss-funds',
      'APEX': '/dashboard/apex',
      'LEADER': '/dashboard/leader',
      'COOPERATIVE': '/dashboard/organization',
      'MEMBER': '/dashboard/member',
    };
    return urls[role] || '/dashboard';
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if ((session.user as any).role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/dashboard/super-admin" className="text-green-600 hover:text-green-500">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Impersonate Users</h1>
        <p className="text-gray-600 mt-2">Login as other users to provide support or test functionality.</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.inactiveUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Roles</p>
                <p className="text-2xl font-semibold text-gray-900">{Object.keys(stats.roleCounts || {}).length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Role
            </label>
            <select
              id="role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Roles</option>
              <option value="APEX">Apex</option>
              <option value="FINANCE">Finance</option>
              <option value="APEX_FUNDS">Apex Funds</option>
              <option value="NOGALSS_FUNDS">Nogalss Funds</option>
              <option value="LEADER">Leader</option>
              <option value="COOPERATIVE">Cooperative</option>
              <option value="MEMBER">Member</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Users {pagination ? `(${pagination.total} total)` : ''}
          </h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dashboard
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getDashboardUrl(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => startImpersonation(user.id)}
                        disabled={!user.isActive || impersonating}
                        className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md ${
                          user.isActive && !impersonating
                            ? 'text-white bg-orange-600 hover:bg-orange-700'
                            : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                        }`}
                      >
                        {impersonating ? 'Starting...' : 'Impersonate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-700">
                <span>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          pageNum === pagination.page
                            ? 'bg-green-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}