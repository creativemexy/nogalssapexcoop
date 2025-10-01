"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Leader {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  cooperative: string;
  status: "Active" | "Inactive";
}

interface Cooperative {
  id: string;
  name: string;
}

interface Bank {
  id: string;
  name: string;
}

export default function ApexLeadersPage() {
  const [search, setSearch] = useState("");
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
    cooperative: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaders();
    fetchCooperatives();
    fetchBanks();
  }, []);

  const fetchLeaders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/apex/leaders");
      if (!res.ok) throw new Error("Failed to fetch leaders");
      const data = await res.json();
      setLeaders(data.leaders || []);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCooperatives = async () => {
    try {
      const res = await fetch("/api/cooperatives/list");
      if (res.ok) {
        const data = await res.json();
        setCooperatives(data.cooperatives || []);
      }
    } catch (err) {
      console.error("Failed to fetch cooperatives:", err);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch("/api/banks/list");
      if (res.ok) {
        const data = await res.json();
        setBanks(data.banks || []);
      }
    } catch (err) {
      console.error("Failed to fetch banks:", err);
    }
  };

  const handleAddLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const res = await fetch("/api/apex/leaders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add leader");
      setLeaders(prev => [data.leader, ...prev]);
      setShowModal(false);
      setForm({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        bankName: "",
        bankAccountNumber: "",
        bankAccountName: "",
        cooperative: ""
      });
    } catch (err: any) {
      setFormError(err.message || "Unknown error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewLeader = (leader: Leader) => {
    setSelectedLeader(leader);
    setShowViewModal(true);
  };

  const handleEditLeader = (leader: Leader) => {
    setSelectedLeader(leader);
    setForm({
      firstName: leader.firstName,
      lastName: leader.lastName,
      phone: leader.phone,
      email: leader.email,
      bankName: leader.bankName,
      bankAccountNumber: leader.bankAccountNumber,
      bankAccountName: leader.bankAccountName,
      cooperative: leader.cooperative
    });
    setShowEditModal(true);
  };

  const handleDeactivateLeader = async (leader: Leader) => {
    if (confirm(`Are you sure you want to ${leader.status === 'Active' ? 'deactivate' : 'activate'} ${leader.firstName} ${leader.lastName}?`)) {
      try {
        const res = await fetch(`/api/apex/leaders/${leader.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: leader.status === 'Active' ? false : true }),
        });
        
        if (res.ok) {
          // Update the leader status in the local state
          setLeaders(prev => prev.map(l => 
            l.id === leader.id 
              ? { ...l, status: l.status === 'Active' ? 'Inactive' : 'Active' }
              : l
          ));
        }
      } catch (err) {
        console.error('Failed to update leader status:', err);
      }
    }
  };

  const filteredLeaders = leaders.filter(l =>
    l.firstName.toLowerCase().includes(search.toLowerCase()) ||
    l.lastName.toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase()) ||
    l.phone.toLowerCase().includes(search.toLowerCase()) ||
    l.cooperative.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Leaders Management</h1>
        <Link href="/dashboard/apex" className="text-[#0D5E42] hover:text-[#0A4A35]">&larr; Back to Apex Dashboard</Link>
      </div>
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search leaders..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-[#0D5E42]"
        />
        <button
          className="ml-4 bg-gray-400 text-white px-6 py-2 rounded cursor-not-allowed opacity-50"
          disabled
          title="Add New Leader feature is temporarily disabled"
        >
          + Add New Leader (Disabled)
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Account Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Account Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cooperative</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeaders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">No leaders found.</td>
                </tr>
              ) : (
                filteredLeaders.map(leader => (
                  <tr key={leader.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{leader.firstName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{leader.lastName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{leader.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{leader.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{leader.bankName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{leader.bankAccountNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{leader.bankAccountName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{leader.cooperative}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${leader.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                        {leader.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button 
                        className="text-blue-600 hover:underline"
                        onClick={() => handleViewLeader(leader)}
                      >
                        View
                      </button>
                      <button 
                        className="text-yellow-600 hover:underline"
                        onClick={() => handleEditLeader(leader)}
                      >
                        Edit
                      </button>
                      <button 
                        className="text-red-600 hover:underline"
                        onClick={() => handleDeactivateLeader(leader)}
                      >
                        {leader.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for Add New Leader */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Add New Leader</h2>
            <form onSubmit={handleAddLeader} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                <select
                  value={form.bankName}
                  onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select a bank</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Account Number</label>
                <input
                  type="text"
                  value={form.bankAccountNumber}
                  onChange={e => setForm(f => ({ ...f, bankAccountNumber: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Account Name</label>
                <input
                  type="text"
                  value={form.bankAccountName}
                  onChange={e => setForm(f => ({ ...f, bankAccountName: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cooperative</label>
                <select
                  value={form.cooperative}
                  onChange={e => setForm(f => ({ ...f, cooperative: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select a cooperative</option>
                  {cooperatives.map(coop => (
                    <option key={coop.id} value={coop.name}>
                      {coop.name}
                    </option>
                  ))}
                </select>
              </div>
              {formError && <div className="text-red-600 text-sm">{formError}</div>}
              <button
                type="submit"
                className="w-full bg-[#0D5E42] text-white px-6 py-2 rounded hover:bg-[#0A4A35] disabled:opacity-50"
                disabled={formLoading}
              >
                {formLoading ? "Adding..." : "Add Leader"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal for View Leader */}
      {showViewModal && selectedLeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setShowViewModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Leader Details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-gray-900">{selectedLeader.firstName} {selectedLeader.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-gray-900">{selectedLeader.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900">{selectedLeader.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                <p className="mt-1 text-gray-900">{selectedLeader.bankName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Account Number</label>
                <p className="mt-1 text-gray-900">{selectedLeader.bankAccountNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Account Name</label>
                <p className="mt-1 text-gray-900">{selectedLeader.bankAccountName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cooperative</label>
                <p className="mt-1 text-gray-900">{selectedLeader.cooperative}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedLeader.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                  {selectedLeader.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 