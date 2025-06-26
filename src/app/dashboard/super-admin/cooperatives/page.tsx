'use client';

import Link from 'next/link';
import { useState } from 'react';

const mockCooperatives = [
  { id: 1, name: 'Unity Cooperative', state: 'Lagos', status: 'Active', created: '2024-06-01' },
  { id: 2, name: 'Progressive Farmers', state: 'Kano', status: 'Pending', created: '2024-05-20' },
  { id: 3, name: 'Sunshine Women', state: 'Oyo', status: 'Inactive', created: '2024-04-15' },
];

export default function CooperativesPage() {
  const [search, setSearch] = useState('');
  const filtered = mockCooperatives.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cooperatives</h1>
        <Link href="/dashboard/super-admin" className="text-green-600 hover:text-green-500">&larr; Back to Dashboard</Link>
      </div>
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Search cooperatives..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
          <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
            + Add Cooperative
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">State</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-400">No cooperatives found.</td>
                </tr>
              ) : (
                filtered.map(coop => (
                  <tr key={coop.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{coop.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{coop.state}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {coop.status === 'Active' && <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">Active</span>}
                      {coop.status === 'Pending' && <span className="inline-block px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded">Pending</span>}
                      {coop.status === 'Inactive' && <span className="inline-block px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-500 rounded">Inactive</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{coop.created}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-green-600 hover:underline mr-3">View</button>
                      <button className="text-yellow-600 hover:underline">Edit</button>
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