'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Cooperative {
  id: string;
  name: string;
  registrationNumber: string;
  city: string;
  state: string;
  status: string;
  createdAt: string;
  memberCount: number;
  leaderCount: number;
  email: string;
  phoneNumber: string;
  address: string;
  bankName: string;
  bankAccountNumber: string;
}

export default function CooperativesPage() {
  const [search, setSearch] = useState('');
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetchCooperatives();
  }, [currentPage, search]);

  const fetchCooperatives = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(search && { search })
      });
      
      const response = await fetch(`/api/admin/cooperatives?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cooperatives');
      }
      
      setCooperatives(data.cooperatives);
      setTotalPages(data.pagination.pages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCooperatives();
  };

  const handleAddCooperative = async (formData: any) => {
    try {
      setAddLoading(true);
      // Initialize cooperative registration via existing public flow
      const payload = {
        registrationType: 'COOPERATIVE',
        cooperativeName: formData.name,
        cooperativeRegNo: formData.registrationNumber,
        bankName: formData.bankName,
        bankAccountNumber: formData.bankAccountNumber,
        bankAccountName: formData.bankAccountName,
        address: formData.address,
        city: formData.city,
        phone: formData.phoneNumber,
        cooperativeEmail: formData.email,
        leaderFirstName: formData.leaderFirstName,
        leaderLastName: formData.leaderLastName,
        leaderEmail: formData.leaderEmail,
        leaderPassword: formData.leaderPassword,
        leaderPhone: formData.leaderPhone,
        leaderTitle: formData.leaderTitle,
        leaderBankName: formData.leaderBankName,
        leaderBankAccountNumber: formData.leaderBankAccountNumber,
        leaderBankAccountName: formData.leaderBankAccountName,
        parentOrganizationId: formData.parentOrganizationId || undefined,
      };
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize registration');
      }

      if (data.payment?.authorizationUrl) {
        window.location.href = data.payment.authorizationUrl;
        return;
      }

      throw new Error('Payment initialization failed');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleViewCooperative = (cooperativeId: string) => {
    // Navigate to cooperative details page
    window.location.href = `/dashboard/super-admin/cooperatives/${cooperativeId}`;
  };

  const handleEditCooperative = (cooperativeId: string) => {
    // Navigate to cooperative edit page
    window.location.href = `/dashboard/super-admin/cooperatives/${cooperativeId}/edit`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cooperatives</h1>
        <Link href="/dashboard/super-admin" className="text-green-600 hover:text-green-500">&larr; Back to Dashboard</Link>
      </div>
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-1/2">
          <input
            type="text"
            placeholder="Search cooperatives..."
            value={search}
            onChange={e => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            <button 
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Search
            </button>
          </form>
          <Link 
            href="/dashboard/super-admin/cooperatives/create"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            + Add Cooperative
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Registration #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                      <span className="ml-2">Loading cooperatives...</span>
                    </div>
                  </td>
                </tr>
              ) : cooperatives.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-400">No cooperatives found.</td>
                </tr>
              ) : (
                cooperatives.map(coop => (
                  <tr key={coop.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{coop.name}</div>
                      <div className="text-sm text-gray-500">{coop.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coop.registrationNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {coop.city}, {coop.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {coop.memberCount} members, {coop.leaderCount} leaders
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {coop.status === 'Active' && <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">Active</span>}
                      {coop.status === 'Inactive' && <span className="inline-block px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-500 rounded">Inactive</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(coop.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleViewCooperative(coop.id)}
                        className="text-green-600 hover:underline mr-3"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEditCooperative(coop.id)}
                        className="text-yellow-600 hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Cooperative now handled on dedicated create page */}
    </div>
  );
}

// Add Cooperative Form Component
function AddCooperativeForm({ onSubmit, onCancel, loading }: { 
  onSubmit: (data: any) => void; 
  onCancel: () => void; 
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    rcNumber: '',
    address: '',
    city: '',
    state: '',
    phoneNumber: '',
    email: '',
    website: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    // Contact person
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    // CAC extras
    companyType: '',
    registrationDate: '',
    tin: '',
    vatNumber: '',
    // Leader details
    leaderFirstName: '',
    leaderLastName: '',
    leaderEmail: '',
    leaderPhone: '',
    leaderPassword: '',
    leaderTitle: '',
    leaderBankName: '',
    leaderBankAccountNumber: '',
    leaderBankAccountName: '',
    // Optional: parent org linkage
    parentOrganizationId: ''
  });

  const [cacSearching, setCacSearching] = useState(false);
  const [cacError, setCacError] = useState<string | null>(null);
  const searchCAC = async () => {
    if (!formData.rcNumber) {
      setCacError('Enter RC Number');
      return;
    }
    try {
      setCacSearching(true);
      setCacError(null);
      const res = await fetch('/api/identity/cac/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rcNumber: formData.rcNumber, registrationType: 'RC' })
      });
      const data = await res.json();
      if (data?.success && data.data) {
        const d = data.data;
        setFormData(prev => ({
          ...prev,
          name: d.name || prev.name,
          registrationNumber: d.registration_number || prev.registrationNumber,
          companyType: d.type_of_entity || prev.companyType,
          registrationDate: d.registration_date?.split('T')[0] || prev.registrationDate,
          address: d.address || prev.address,
          state: d.state || prev.state,
          city: d.city || prev.city,
          contactEmail: d.email || prev.contactEmail,
          contactPhone: d.phone_number || prev.contactPhone,
          tin: d.tin || prev.tin,
          vatNumber: d.vat_number || prev.vatNumber,
        }));
      } else {
        setCacError(data?.error || 'Company not found');
      }
    } catch (e:any) {
      setCacError(e.message || 'Lookup failed');
    } finally {
      setCacSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-green-50 border border-green-200 rounded">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">RC Number (optional)</label>
            <input
              type="text"
              name="rcNumber"
              value={formData.rcNumber}
              onChange={handleChange}
              placeholder="e.g., RC00000011 or 00000011"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button type="button" onClick={searchCAC} disabled={cacSearching || !formData.rcNumber} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50">
              {cacSearching ? 'Searching…' : 'Lookup CAC'}
            </button>
            {cacError && <span className="text-sm text-red-600">{cacError}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Cooperative Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Registration Number *</label>
          <input
            type="text"
            name="registrationNumber"
            value={formData.registrationNumber}
            onChange={handleChange}
            required
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Address *</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">City *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">State *</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Website</label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://"
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Person</label>
          <input
            type="text"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Email</label>
          <input
            type="email"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
          <input
            type="text"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Bank Name *</label>
          <input
            type="text"
            name="bankName"
            value={formData.bankName}
            onChange={handleChange}
            required
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Bank Account Number *</label>
          <input
            type="text"
            name="bankAccountNumber"
            value={formData.bankAccountNumber}
            onChange={handleChange}
            required
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Company Type</label>
          <input
            type="text"
            name="companyType"
            value={formData.companyType}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Registration Date</label>
          <input
            type="date"
            name="registrationDate"
            value={formData.registrationDate}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">TIN</label>
          <input
            type="text"
            name="tin"
            value={formData.tin}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">VAT Number</label>
          <input
            type="text"
            name="vatNumber"
            value={formData.vatNumber}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Cooperative'}
        </button>
      </div>
    </form>
  );
} 