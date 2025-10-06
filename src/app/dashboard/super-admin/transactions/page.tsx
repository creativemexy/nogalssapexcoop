'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

interface Row {
  id: string;
  createdAt: string;
  user: string;
  email: string;
  cooperative: string;
  type: string;
  amount: number;
  status: string;
  reference: string;
  description: string;
  source: string;
}

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [sortBy, setSortBy] = useState<'createdAt' | 'amount' | 'status' | 'type'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchData();
  }, [page, search, sortBy, sortOrder]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10', sortBy, sortOrder });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/transactions?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch transactions');
      setRows(data.rows || []);
      setPages(data.pagination?.pages || 1);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = useMemo(() => rows.reduce((sum, r) => sum + (r.amount || 0), 0), [rows]);

  const onSort = (field: 'createdAt' | 'amount' | 'status' | 'type') => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <Link href="/dashboard/super-admin" className="text-green-600 hover:text-green-500">&larr; Back to Dashboard</Link>
      </div>
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Search transactions (ref, user, coop, desc)..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
          <div className="text-sm text-gray-700">Total on page: ₦{totalAmount.toLocaleString()}</div>
        </div>
        <div className="overflow-x-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-500">Loading transactions...</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No transactions found.</div>
          ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-yellow-50">
              <tr>
                  <Th onClick={() => onSort('createdAt')}>Date</Th>
                  <Th>User</Th>
                  <Th>Cooperative</Th>
                  <Th onClick={() => onSort('type')}>Type</Th>
                  <Th>Reference</Th>
                  <Th>Description</Th>
                  <Th className="text-right" onClick={() => onSort('amount')}>Amount</Th>
                  <Th onClick={() => onSort('status')}>Status</Th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
                {rows.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <Td>{new Date(tx.createdAt).toLocaleString()}</Td>
                    <Td>{tx.user}</Td>
                    <Td>{tx.cooperative}</Td>
                    <Td>
                      <div className="flex items-center">
                        <span>{tx.type}</span>
                        {tx.source === 'contribution' && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Contribution
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td>{tx.reference}</Td>
                    <Td className="max-w-xs truncate" title={tx.description}>{tx.description}</Td>
                    <Td className="text-right">₦{(tx.amount || 0).toLocaleString()}</Td>
                    <Td>
                      {tx.status === 'SUCCESSFUL' && <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">Successful</span>}
                      {tx.status === 'PENDING' && <span className="inline-block px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded">Pending</span>}
                      {tx.status === 'FAILED' && <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">Failed</span>}
                      {tx.status === 'CANCELLED' && <span className="inline-block px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded">Cancelled</span>}
                    </Td>
                  </tr>
                ))}
            </tbody>
          </table>
          )}
        </div>
        {pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">Page {page} of {pages}</div>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children, onClick, className = '' }: any) {
  return <th onClick={onClick} className={`px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider cursor-pointer ${className}`}>{children}</th>;
}
function Td({ children, className = '' }: any) {
  return <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>{children}</td>;
} 