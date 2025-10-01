"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Loan {
  id: string;
  borrowerName: string;
  borrowerEmail: string;
  cooperative: string;
  amount: number;
  purpose: string;
  interestRate: number;
  duration: number; // in months
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "COMPLETED";
  approvedBy: string | null;
  approvedAt: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export default function ApexLoansPage() {
  const [search, setSearch] = useState("");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/apex/loans");
      if (!res.ok) throw new Error("Failed to fetch loans");
      const data = await res.json();
      setLoans(data.loans || []);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowViewModal(true);
  };

  const handleApproveLoan = async (loan: Loan) => {
    if (confirm(`Are you sure you want to approve the loan for ${loan.borrowerName}?`)) {
      try {
        const res = await fetch(`/api/apex/loans/${loan.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'APPROVED' }),
        });
        
        if (res.ok) {
          setLoans(prev => prev.map(l => 
            l.id === loan.id 
              ? { ...l, status: 'APPROVED' as const, approvedAt: new Date().toISOString() }
              : l
          ));
        }
      } catch (err) {
        console.error('Failed to approve loan:', err);
      }
    }
  };

  const handleRejectLoan = async (loan: Loan) => {
    if (confirm(`Are you sure you want to reject the loan for ${loan.borrowerName}?`)) {
      try {
        const res = await fetch(`/api/apex/loans/${loan.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'REJECTED' }),
        });
        
        if (res.ok) {
          setLoans(prev => prev.map(l => 
            l.id === loan.id 
              ? { ...l, status: 'REJECTED' as const }
              : l
          ));
        }
      } catch (err) {
        console.error('Failed to reject loan:', err);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = 
      loan.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
      loan.borrowerEmail.toLowerCase().includes(search.toLowerCase()) ||
      loan.cooperative.toLowerCase().includes(search.toLowerCase()) ||
      loan.purpose.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || loan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Loans Management</h1>
        <Link href="/dashboard/apex" className="text-[#0D5E42] hover:text-[#0A4A35]">&larr; Back to Apex Dashboard</Link>
      </div>
      
      {/* Filters and Search */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search loans..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-[#0D5E42]"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0D5E42]"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <button
          className="ml-4 bg-gray-400 text-white px-6 py-2 rounded cursor-not-allowed opacity-50"
          disabled
          title="Add New Loan feature is temporarily disabled"
        >
          + Add New Loan (Disabled)
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-600">Total Loans</div>
          <div className="text-2xl font-bold text-gray-900">{loans.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{loans.filter(l => l.status === 'PENDING').length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-600">Approved</div>
          <div className="text-2xl font-bold text-green-600">{loans.filter(l => l.status === 'APPROVED').length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-600">Active</div>
          <div className="text-2xl font-bold text-blue-600">{loans.filter(l => l.status === 'ACTIVE').length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-600">Total Amount</div>
          <div className="text-2xl font-bold text-gray-900">₦{loans.reduce((sum, loan) => sum + loan.amount, 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrower</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cooperative</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">No loans found.</td>
                </tr>
              ) : (
                filteredLoans.map(loan => (
                  <tr key={loan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{loan.borrowerName}</div>
                        <div className="text-sm text-gray-500">{loan.borrowerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{loan.cooperative}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">₦{loan.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{loan.purpose}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{loan.interestRate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{loan.duration} months</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {new Date(loan.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button 
                        className="text-blue-600 hover:underline"
                        onClick={() => handleViewLoan(loan)}
                      >
                        View
                      </button>
                      {loan.status === 'PENDING' && (
                        <>
                          <button 
                            className="text-green-600 hover:underline"
                            onClick={() => handleApproveLoan(loan)}
                          >
                            Approve
                          </button>
                          <button 
                            className="text-red-600 hover:underline"
                            onClick={() => handleRejectLoan(loan)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button 
                        className="text-yellow-600 hover:underline"
                        onClick={() => {/* TODO: Edit loan */}}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for View Loan */}
      {showViewModal && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setShowViewModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Loan Details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Borrower</label>
                <p className="mt-1 text-gray-900">{selectedLoan.borrowerName}</p>
                <p className="text-sm text-gray-500">{selectedLoan.borrowerEmail}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cooperative</label>
                <p className="mt-1 text-gray-900">{selectedLoan.cooperative}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <p className="mt-1 text-gray-900">₦{selectedLoan.amount.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Purpose</label>
                <p className="mt-1 text-gray-900">{selectedLoan.purpose}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Interest Rate</label>
                <p className="mt-1 text-gray-900">{selectedLoan.interestRate}%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration</label>
                <p className="mt-1 text-gray-900">{selectedLoan.duration} months</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedLoan.status)}`}>
                  {selectedLoan.status}
                </span>
              </div>
              {selectedLoan.approvedBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Approved By</label>
                  <p className="mt-1 text-gray-900">{selectedLoan.approvedBy}</p>
                </div>
              )}
              {selectedLoan.approvedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Approved At</label>
                  <p className="mt-1 text-gray-900">{new Date(selectedLoan.approvedAt).toLocaleString()}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1 text-gray-900">{new Date(selectedLoan.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 