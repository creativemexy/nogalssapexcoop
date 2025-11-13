'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Withdrawal {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    role: string;
  };
  amount: number;
  reason: string;
  status: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SuperAdminWithdrawalsPage() {
  const { data: session } = useSession();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionStatus, setActionStatus] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter, currentPage]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', currentPage.toString());
      params.append('limit', '20');

      const res = await fetch(`/api/admin/withdrawals?${params}`);
      const data = await res.json();

      if (data.success) {
        setWithdrawals(data.withdrawals || []);
        setPagination(data.pagination || null);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedWithdrawal || !actionStatus) return;

    try {
      setProcessing(true);
      const res = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionStatus,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setSelectedWithdrawal(null);
        setActionStatus('');
        setNotes('');
        fetchWithdrawals();
      } else {
        alert(data.error || 'Failed to update withdrawal');
      }
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      alert('Failed to update withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'PROCESSED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MEMBER':
        return 'bg-blue-100 text-blue-800';
      case 'LEADER':
        return 'bg-purple-100 text-purple-800';
      case 'COOPERATIVE':
        return 'bg-green-100 text-green-800';
      case 'PARENT_ORGANIZATION':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && withdrawals.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Withdrawal Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and process all withdrawal requests</p>
        </div>
        <Link
          href="/dashboard/super-admin"
          className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 mt-4 sm:mt-0"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PROCESSED">Processed</option>
            </select>
          </div>
          <div className="ml-auto">
            <button
              onClick={fetchWithdrawals}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No withdrawals found
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {withdrawal.user.firstName} {withdrawal.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {withdrawal.user.email}
                        </div>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${getRoleColor(withdrawal.user.role)}`}>
                          {withdrawal.user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        ₦{withdrawal.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                        {withdrawal.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(withdrawal.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal);
                          setShowModal(true);
                          setActionStatus('');
                          setNotes('');
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Manage Withdrawal Request
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    User
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedWithdrawal.user.firstName} {selectedWithdrawal.user.lastName} ({selectedWithdrawal.user.email})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount
                  </label>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ₦{selectedWithdrawal.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedWithdrawal.reason}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Status
                  </label>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedWithdrawal.status)}`}>
                    {selectedWithdrawal.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Requested At
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {new Date(selectedWithdrawal.requestedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Update Status
                </label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select action...</option>
                  {selectedWithdrawal.status === 'PENDING' && (
                    <>
                      <option value="APPROVED">Approve</option>
                      <option value="REJECTED">Reject</option>
                    </>
                  )}
                  {selectedWithdrawal.status === 'APPROVED' && (
                    <option value="PROCESSED">Mark as Processed</option>
                  )}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Add notes about this withdrawal..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleStatusUpdate}
                  disabled={!actionStatus || processing}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Update Status'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedWithdrawal(null);
                    setActionStatus('');
                    setNotes('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

