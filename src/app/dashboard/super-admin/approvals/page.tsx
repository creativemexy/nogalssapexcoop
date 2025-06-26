'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ApprovalItem {
  id: string;
  type: 'COOPERATIVE' | 'LOAN' | 'WITHDRAWAL' | 'MEMBERSHIP';
  title: string;
  description: string;
  requester: string;
  amount?: number;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'COOPERATIVE' | 'LOAN' | 'WITHDRAWAL' | 'MEMBERSHIP'>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Mock data - in a real app, this would come from an API
  useEffect(() => {
    const mockApprovals: ApprovalItem[] = [
      {
        id: '1',
        type: 'COOPERATIVE',
        title: 'New Cooperative Registration',
        description: 'Green Farmers Cooperative Society seeking registration',
        requester: 'John Doe',
        date: '2024-01-15',
        status: 'PENDING'
      },
      {
        id: '2',
        type: 'LOAN',
        title: 'Equipment Loan Request',
        description: 'Loan request for farming equipment purchase',
        requester: 'Sarah Johnson',
        amount: 500000,
        date: '2024-01-14',
        status: 'PENDING'
      },
      {
        id: '3',
        type: 'WITHDRAWAL',
        title: 'Contribution Withdrawal',
        description: 'Emergency withdrawal request',
        requester: 'Mike Wilson',
        amount: 150000,
        date: '2024-01-13',
        status: 'PENDING'
      },
      {
        id: '4',
        type: 'MEMBERSHIP',
        title: 'New Member Application',
        description: 'Application to join Urban Traders Cooperative',
        requester: 'Lisa Brown',
        date: '2024-01-12',
        status: 'PENDING'
      },
      {
        id: '5',
        type: 'LOAN',
        title: 'Business Expansion Loan',
        description: 'Loan for business expansion and inventory',
        requester: 'David Chen',
        amount: 750000,
        date: '2024-01-11',
        status: 'PENDING'
      }
    ];

    setTimeout(() => {
      setApprovals(mockApprovals);
      setLoading(false);
    }, 1000);
  }, []);

  const handleApproval = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setProcessingId(id);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setApprovals(prev => prev.map(item => 
      item.id === id ? { ...item, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' } : item
    ));
    
    setProcessingId(null);
  };

  const filteredApprovals = approvals.filter(item => 
    filter === 'ALL' || item.type === filter
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'COOPERATIVE': return 'bg-green-100 text-green-800';
      case 'LOAN': return 'bg-yellow-100 text-yellow-800';
      case 'WITHDRAWAL': return 'bg-red-100 text-red-800';
      case 'MEMBERSHIP': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'COOPERATIVE':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'LOAN':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'WITHDRAWAL':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'MEMBERSHIP':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
        <Link href="/dashboard/super-admin" className="text-green-600 hover:text-green-500">
          &larr; Back to Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{approvals.length}</div>
          <div className="text-sm text-gray-600">Total Pending</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {approvals.filter(a => a.type === 'LOAN').length}
          </div>
          <div className="text-sm text-gray-600">Loan Requests</div>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-700">
            {approvals.filter(a => a.type === 'COOPERATIVE').length}
          </div>
          <div className="text-sm text-gray-600">Cooperative Registrations</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {approvals.filter(a => a.type === 'MEMBERSHIP').length}
          </div>
          <div className="text-sm text-gray-600">Membership Applications</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'ALL' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setFilter('COOPERATIVE')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'COOPERATIVE' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cooperatives
          </button>
          <button
            onClick={() => setFilter('LOAN')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'LOAN' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Loans
          </button>
          <button
            onClick={() => setFilter('WITHDRAWAL')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'WITHDRAWAL' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Withdrawals
          </button>
          <button
            onClick={() => setFilter('MEMBERSHIP')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'MEMBERSHIP' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Memberships
          </button>
        </div>
      </div>

      {/* Approvals List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredApprovals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No pending approvals</p>
            <p className="text-sm">All approval requests have been processed.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredApprovals.map((approval) => (
              <div key={approval.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${getTypeColor(approval.type)}`}>
                      {getTypeIcon(approval.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{approval.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          approval.status === 'PENDING' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : approval.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {approval.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{approval.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Requested by: {approval.requester}</span>
                        <span>Date: {new Date(approval.date).toLocaleDateString()}</span>
                        {approval.amount && (
                          <span className="font-medium text-gray-900">
                            Amount: ₦{approval.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {approval.status === 'PENDING' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproval(approval.id, 'APPROVE')}
                        disabled={processingId === approval.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {processingId === approval.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleApproval(approval.id, 'REJECT')}
                        disabled={processingId === approval.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {processingId === approval.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  )}
                  
                  {approval.status !== 'PENDING' && (
                    <div className="text-sm">
                      <span className={`font-medium ${
                        approval.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {approval.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 