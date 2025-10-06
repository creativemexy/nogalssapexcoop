'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  status: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
  creator: {
    firstName: string;
    lastName: string;
    email: string;
  };
  approver?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ExpensesResponse {
  expenses: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function FinanceExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'OFFICE_SUPPLIES',
    receiptUrl: '',
    notes: ''
  });

  const categories = [
    { value: 'OFFICE_SUPPLIES', label: 'Office Supplies' },
    { value: 'UTILITIES', label: 'Utilities' },
    { value: 'TRAVEL', label: 'Travel' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'OTHER', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'PAID', label: 'Paid' }
  ];

  useEffect(() => {
    fetchExpenses();
  }, [currentPage, statusFilter, categoryFilter, searchTerm]);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(categoryFilter !== 'ALL' && { category: categoryFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/finance/expenses?${params}`);
      const data: ExpensesResponse = await response.json();
      
      if (response.ok) {
        setExpenses(data.expenses);
      } else {
        setError('Failed to fetch expenses');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          amount: '',
          category: 'OFFICE_SUPPLIES',
          receiptUrl: '',
          notes: ''
        });
        fetchExpenses();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create expense');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/finance/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        }),
      });

      if (response.ok) {
        setEditingExpense(null);
        setFormData({
          title: '',
          description: '',
          amount: '',
          category: 'OFFICE_SUPPLIES',
          receiptUrl: '',
          notes: ''
        });
        fetchExpenses();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update expense');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/finance/expenses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchExpenses();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete expense');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete expense');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount.toString(),
      category: expense.category,
      receiptUrl: expense.receiptUrl || '',
      notes: expense.notes || ''
    });
    setShowCreateForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'PAID': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            + Add Expense
          </button>
          <Link href="/dashboard/finance" className="text-green-600 hover:text-green-700">
            ← Back to Finance Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="ALL">All Categories</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search expenses..."
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setCategoryFilter('ALL');
                setSearchTerm('');
              }}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingExpense ? 'Edit Expense' : 'Create New Expense'}
            </h2>
            
            <form onSubmit={editingExpense ? handleEditExpense : handleCreateExpense}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Expense title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₦) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Receipt URL</label>
                  <input
                    type="url"
                    value={formData.receiptUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, receiptUrl: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="https://example.com/receipt"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Expense description"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Additional notes"
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingExpense(null);
                    setFormData({
                      title: '',
                      description: '',
                      amount: '',
                      category: 'OFFICE_SUPPLIES',
                      receiptUrl: '',
                      notes: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingExpense ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Expenses</h2>
        </div>
        
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No expenses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                        {expense.description && (
                          <div className="text-sm text-gray-500">{expense.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₦{expense.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getCategoryLabel(expense.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {expense.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => startEdit(expense)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {expense.receiptUrl && (
                          <a
                            href={expense.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Receipt
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
