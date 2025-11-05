'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Loan {
  id: string;
  amount: number;
  purpose: string;
  interestRate: number;
  duration: number;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  cooperative: {
    id: string;
    name: string;
    registrationNumber: string;
  };
  payments: {
    totalPaid: number;
    remainingAmount: number;
    totalAmount: number;
    paymentCount: number;
  };
}

interface LoanStats {
  totalLoans: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
  pendingLoans: number;
  approvedLoans: number;
  rejectedLoans: number;
  repaidLoans: number;
}

export default function MemberLoansPage() {
  const { data: session } = useSession();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [stats, setStats] = useState<LoanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REPAID'>('all');

  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/member/loans');
      const data = await response.json();
      
      if (response.ok) {
        setLoans(data.loans || []);
        setStats(data.stats || null);
      } else {
        setError(data.error || 'Failed to fetch loans');
      }
    } catch (err) {
      setError('Network error - unable to fetch loans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'REPAID':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLoans = statusFilter === 'all' 
    ? loans 
    : loans.filter(loan => loan.status === statusFilter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your loans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Loans</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchLoans}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Link href="/dashboard/member" className="hover:text-gray-700">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900">My Loans</span>
        </nav>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Loans</h1>
            <p className="mt-2 text-gray-600">
              View and manage your loan applications
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex gap-2">
            <Link
              href="/dashboard/member/apply-loan"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Apply for Loan
            </Link>
            <button
              onClick={fetchLoans}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Loans</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalLoans}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Borrowed</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalAmount)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Repaid</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Outstanding</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalOutstanding)}</div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            statusFilter === 'all'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({loans.length})
        </button>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            statusFilter === 'PENDING'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pending ({stats?.pendingLoans || 0})
        </button>
        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            statusFilter === 'APPROVED'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Approved ({stats?.approvedLoans || 0})
        </button>
        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            statusFilter === 'REJECTED'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Rejected ({stats?.rejectedLoans || 0})
        </button>
        <button
          onClick={() => setStatusFilter('REPAID')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            statusFilter === 'REPAID'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Repaid ({stats?.repaidLoans || 0})
        </button>
      </div>

      {/* Loans Table */}
      {filteredLoans.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center border border-gray-200">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Loans Found</h3>
          <p className="text-gray-600 mb-6">
            {statusFilter === 'all' 
              ? "You haven't applied for any loans yet."
              : `You don't have any ${statusFilter.toLowerCase()} loans.`
            }
          </p>
          <Link
            href="/dashboard/member/apply-loan"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Apply for Loan
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loan Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Repayment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {loan.purpose}
                        </div>
                        <div className="text-sm text-gray-500">
                          {loan.cooperative.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {loan.duration} months • {loan.interestRate}% interest
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(loan.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Total: {formatCurrency(loan.payments.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Paid: {formatCurrency(loan.payments.totalPaid)}
                      </div>
                      <div className="text-sm text-red-600 font-medium">
                        Remaining: {formatCurrency(loan.payments.remainingAmount)}
                      </div>
                      {loan.payments.paymentCount > 0 && (
                        <div className="text-xs text-gray-500">
                          {loan.payments.paymentCount} payment(s)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Applied: {formatDate(loan.createdAt)}</div>
                      {loan.approvedAt && (
                        <div>Approved: {formatDate(loan.approvedAt)}</div>
                      )}
                      {loan.endDate && (
                        <div>Due: {formatDate(loan.endDate)}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

