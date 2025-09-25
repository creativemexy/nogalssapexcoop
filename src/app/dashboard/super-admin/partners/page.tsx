'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Partner {
  id: string;
  name: string;
  logo: string;
  website?: string;
  description?: string;
}

export default function PartnersAdminPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/partners');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch partners');
      setPartners(data.partners || []);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (formData: any) => {
    setFormLoading(true);
    setFormError(null);
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add partner');
      setShowAddModal(false);
      fetchPartners();
    } catch (err: any) {
      setFormError(err.message || 'Unknown error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (formData: any) => {
    setFormLoading(true);
    setFormError(null);
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: selectedPartner?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update partner');
      setShowEditModal(false);
      setSelectedPartner(null);
      fetchPartners();
    } catch (err: any) {
      setFormError(err.message || 'Unknown error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this partner?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete partner');
      fetchPartners();
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Our Partners</h1>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/super-admin" className="text-green-600 hover:text-green-500 underline">&larr; Back to Dashboard</Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            + Add Partner
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-500">Loading partners...</span>
          </div>
        ) : partners.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No partners found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Logo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Website</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img src={partner.logo} alt={partner.name} className="h-12 w-12 object-contain rounded-full border" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{partner.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {partner.website ? (
                        <a href={partner.website} target="_blank" rel="noopener noreferrer" className="underline">{partner.website}</a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate">{partner.description || <span className="text-gray-400">—</span>}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-yellow-600 hover:underline mr-3"
                        onClick={() => { setSelectedPartner(partner); setShowEditModal(true); }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => handleDelete(partner.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Add Partner Modal */}
      {showAddModal && (
        <PartnerModal
          title="Add Partner"
          onSubmit={handleAdd}
          onCancel={() => setShowAddModal(false)}
          loading={formLoading}
          error={formError}
        />
      )}
      {/* Edit Partner Modal */}
      {showEditModal && selectedPartner && (
        <PartnerModal
          title="Edit Partner"
          initialData={selectedPartner}
          onSubmit={handleEdit}
          onCancel={() => { setShowEditModal(false); setSelectedPartner(null); }}
          loading={formLoading}
          error={formError}
        />
      )}
    </div>
  );
}

function PartnerModal({ title, initialData, onSubmit, onCancel, loading, error }: {
  title: string;
  initialData?: Partial<Partner>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    logo: initialData?.logo || '',
    website: initialData?.website || '',
    description: initialData?.description || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        {error && <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
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
            <label className="block text-sm font-medium text-gray-700">Logo URL *</label>
            <input
              type="url"
              name="logo"
              value={formData.logo}
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
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
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
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
