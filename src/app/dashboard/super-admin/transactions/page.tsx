'use client';

import Link from 'next/link';
import { useState } from 'react';

const mockTransactions = [
  { id: 1, date: '2024-06-22', user: 'John Doe', type: 'Deposit', amount: 50000, status: 'Success' },
  { id: 2, date: '2024-06-21', user: 'Jane Smith', type: 'Withdrawal', amount: 20000, status: 'Pending' },
  { id: 3, date: '2024-06-20', user: 'Unity Cooperative', type: 'Loan', amount: 100000, status: 'Failed' },
];

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const filtered = mockTransactions.filter(t => t.user.toLowerCase().includes(search.toLowerCase()));

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
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
          <button className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-md font-medium hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500">
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-yellow-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-400">No transactions found.</td>
                </tr>
              ) : (
                filtered.map(tx => (
                  <tr key={tx.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{tx.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{tx.user}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{tx.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">₦{tx.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tx.status === 'Success' && <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">Success</span>}
                      {tx.status === 'Pending' && <span className="inline-block px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded">Pending</span>}
                      {tx.status === 'Failed' && <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">Failed</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-green-600 hover:underline mr-3">View</button>
                      <button className="text-yellow-600 hover:underline">Export</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 