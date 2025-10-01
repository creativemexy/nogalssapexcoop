"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Cooperative {
  id: string;
  name: string;
  registrationNumber: string;
  address: string;
  city: string;
  phoneNumber: string;
  email: string;
  bankName: string;
  bankAccountNumber: string;
  description: string;
  isActive: boolean;
  approved: boolean;
  createdAt: string;
}

export default function ApexCooperativesPage() {
  const [search, setSearch] = useState("");
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCooperative, setSelectedCooperative] = useState<Cooperative | null>(null);

  useEffect(() => {
    fetchCooperatives();
  }, []);

  const fetchCooperatives = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/apex/cooperatives");
      if (!res.ok) throw new Error("Failed to fetch cooperatives");
      const data = await res.json();
      setCooperatives(data.cooperatives || []);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewCooperative = (cooperative: Cooperative) => {
    setSelectedCooperative(cooperative);
    setShowViewModal(true);
  };

  const handleDeactivateCooperative = async (cooperative: Cooperative) => {
    if (confirm(`Are you sure you want to ${cooperative.isActive ? 'deactivate' : 'activate'} ${cooperative.name}?`)) {
      try {
        const res = await fetch(`/api/apex/cooperatives/${cooperative.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !cooperative.isActive }),
        });
        
        if (res.ok) {
          setCooperatives(prev => prev.map(c => 
            c.id === cooperative.id 
              ? { ...c, isActive: !c.isActive }
              : c
          ));
        }
      } catch (err) {
        console.error('Failed to update cooperative status:', err);
      }
    }
  };

  const filteredCooperatives = cooperatives.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cooperatives Management</h1>
        <Link href="/dashboard/apex" className="text-[#0D5E42] hover:text-[#0A4A35]">&larr; Back to Apex Dashboard</Link>
      </div>
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search cooperatives..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-[#0D5E42]"
        />
        <button
          className="ml-4 bg-gray-400 text-white px-6 py-2 rounded cursor-not-allowed opacity-50"
          disabled
          title="Add New Cooperative feature is temporarily disabled"
        >
          + Add New Cooperative (Disabled)
        </button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCooperatives.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">No cooperatives found.</td>
                </tr>
              ) : (
                filteredCooperatives.map(cooperative => (
                  <tr key={cooperative.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{cooperative.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{cooperative.registrationNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{cooperative.city}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{cooperative.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{cooperative.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{cooperative.bankName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cooperative.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                        {cooperative.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cooperative.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {cooperative.approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button 
                        className="text-blue-600 hover:underline"
                        onClick={() => handleViewCooperative(cooperative)}
                      >
                        View
                      </button>
                      <button 
                        className="text-yellow-600 hover:underline"
                        onClick={() => {/* TODO: Edit cooperative */}}
                      >
                        Edit
                      </button>
                      <button 
                        className="text-red-600 hover:underline"
                        onClick={() => handleDeactivateCooperative(cooperative)}
                      >
                        {cooperative.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for View Cooperative */}
      {showViewModal && selectedCooperative && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setShowViewModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Cooperative Details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-gray-900">{selectedCooperative.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                <p className="mt-1 text-gray-900">{selectedCooperative.registrationNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-gray-900">{selectedCooperative.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <p className="mt-1 text-gray-900">{selectedCooperative.city}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-gray-900">{selectedCooperative.phoneNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900">{selectedCooperative.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                <p className="mt-1 text-gray-900">{selectedCooperative.bankName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Account Number</label>
                <p className="mt-1 text-gray-900">{selectedCooperative.bankAccountNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-gray-900">{selectedCooperative.description || 'No description'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedCooperative.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                  {selectedCooperative.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Approval Status</label>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedCooperative.approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {selectedCooperative.approved ? "Approved" : "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 