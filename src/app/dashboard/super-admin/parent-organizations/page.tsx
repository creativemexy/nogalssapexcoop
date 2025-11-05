'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ParentOrganization {
  id: string;
  name: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  website?: string;
  logo?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: ParentOrganization;
  children: ParentOrganization[];
  cooperatives: Array<{
    id: string;
    name: string;
    _count: {
      members: number;
    };
  }>;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface OrganizationsResponse {
  organizations: ParentOrganization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function ParentOrganizationsPage() {
  const { data: session } = useSession();
  const [organizations, setOrganizations] = useState<ParentOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<ParentOrganization | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, [pagination.page, search]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/parent-organizations?${params}`);
      if (!response.ok) throw new Error('Failed to fetch organizations');
      
      const data: OrganizationsResponse = await response.json();
      setOrganizations(data.organizations);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOrganizations();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organization?')) return;

    try {
      const response = await fetch(`/api/admin/parent-organizations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete organization');
      }

      // Refresh the list
      fetchOrganizations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Navigation Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard/super-admin" className="hover:text-gray-700">
          Super Admin Dashboard
        </Link>
        <span>/</span>
        <span className="text-gray-900">Parent Organizations</span>
      </nav>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Parent Organizations</h1>
          <p className="text-gray-600 mt-1">Manage parent organizations and their hierarchy</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/super-admin"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <Link
            href="/dashboard/super-admin/parent-organizations/create"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Organization
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPagination(prev => ({ ...prev, page: 1 }));
                fetchOrganizations();
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Organizations List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      ) : organizations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No organizations found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <div key={org.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                  {org.parent && (
                    <p className="text-sm text-gray-500">Parent: {org.parent.name}</p>
                  )}
                  
                  {/* Organization Summary */}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="mr-1">🏢</span>
                      <span>{org.cooperatives.length} cooperatives</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">👥</span>
                      <span>{org.cooperatives.reduce((total, coop) => total + coop._count.members, 0)} members</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">🏛️</span>
                      <span>{org.children.length} child orgs</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedOrg(org);
                      setShowEditModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(org.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {org.description && (
                <p className="text-gray-600 text-sm mb-3">{org.description}</p>
              )}

              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Email:</span> {org.contactEmail}</p>
                {org.contactPhone && (
                  <p><span className="font-medium">Phone:</span> {org.contactPhone}</p>
                )}
                {org.address && (
                  <p><span className="font-medium">Address:</span> {org.address}</p>
                )}
                {org.website && (
                  <p><span className="font-medium">Website:</span> 
                    <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                      {org.website}
                    </a>
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center text-gray-500">
                      <span className="mr-1">🏢</span>
                      <span>{org.cooperatives.length} cooperatives</span>
                    </div>
                    <div className="flex items-center text-gray-500 mt-1">
                      <span className="mr-1">👥</span>
                      <span>{org.cooperatives.reduce((total, coop) => total + coop._count.members, 0)} total members</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center text-gray-500">
                      <span className="mr-1">🏛️</span>
                      <span>{org.children.length} child orgs</span>
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      Created by {org.creator.firstName} {org.creator.lastName}
                    </div>
                  </div>
                </div>
                
                {/* Cooperatives List */}
                {org.cooperatives.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">Cooperatives under this organization:</p>
                    <div className="space-y-1">
                      {org.cooperatives.map((coop) => (
                        <div key={coop.id} className="flex justify-between items-center text-xs bg-gray-50 px-2 py-1 rounded">
                          <span className="text-gray-700">{coop.name}</span>
                          <span className="text-gray-500">{coop._count.members} members</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={!pagination.hasPrev}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={!pagination.hasNext}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            Next
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <OrganizationModal
          organization={selectedOrg}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedOrg(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedOrg(null);
            fetchOrganizations();
          }}
        />
      )}
    </div>
  );
}

// Organization Modal Component
function OrganizationModal({ 
  organization, 
  onClose, 
  onSuccess 
}: { 
  organization: ParentOrganization | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    website: '',
    logo: '',
    parentId: '',
    // President details
    presidentFirstName: '',
    presidentLastName: '',
    presidentEmail: '',
    presidentPhone: '',
    // Bank details
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    // CAC details
    rcNumber: '',
    companyType: '',
    registrationDate: '',
    businessActivities: '',
  });
  const [banks, setBanks] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  
  // CAC search states
  const [cacSearchType, setCacSearchType] = useState<'rc' | 'name'>('rc');
  const [cacSearchValue, setCacSearchValue] = useState('');
  const [cacSearching, setCacSearching] = useState(false);
  const [cacData, setCacData] = useState<any>(null);
  const [cacError, setCacError] = useState<string | null>(null);
  const [cacLocked, setCacLocked] = useState(false);
  const [skipLookup, setSkipLookup] = useState(false);

  useEffect(() => {
    console.log('🏢 CAC Integration loaded in OrganizationModal');
    fetchBanks();
  }, []);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        description: organization.description || '',
        contactEmail: organization.contactEmail,
        contactPhone: organization.contactPhone || '',
        address: organization.address || '',
        website: organization.website || '',
        logo: organization.logo || '',
        parentId: organization.parentId || '',
        // President details (these would need to be added to the API response)
        presidentFirstName: '',
        presidentLastName: '',
        presidentEmail: '',
        presidentPhone: '',
        // Bank details (these would need to be added to the API response)
        bankName: '',
        bankAccountNumber: '',
        bankAccountName: '',
        // CAC details
        rcNumber: '',
        companyType: '',
        registrationDate: '',
        businessActivities: '',
      });
    }
  }, [organization]);

  const fetchBanks = async () => {
    try {
      setLoadingBanks(true);
      const response = await fetch('/api/banks/list');
      if (!response.ok) throw new Error('Failed to fetch banks');
      const data = await response.json();
      setBanks(data.banks || []);
    } catch (err) {
      console.error('Error fetching banks:', err);
    } finally {
      setLoadingBanks(false);
    }
  };

  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailError(null);
      return;
    }

    try {
      setCheckingEmail(true);
      const response = await fetch(`/api/admin/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (response.ok && data.available) {
        setEmailError(null);
      } else {
        setEmailError(data.error || 'Email is already in use');
      }
    } catch (err) {
      console.error('Error checking email:', err);
    } finally {
      setCheckingEmail(false);
    }
  };

  const searchCAC = async () => {
    if (!cacSearchValue.trim()) {
      setCacError('Please enter RC Number or Company Name');
      return;
    }

    try {
      setCacSearching(true);
      setCacError(null);
      
      const response = await fetch('/api/cac/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [cacSearchType === 'rc' ? 'rcNumber' : 'companyName']: cacSearchValue
        })
      });

      const data = await response.json();

      if (data.success) {
        setCacData(data.data);
        // Auto-populate form with CAC data
        setFormData(prev => ({
          ...prev,
          name: data.data.companyName,
          rcNumber: data.data.rcNumber,
          companyType: data.data.companyType,
          registrationDate: data.data.registrationDate,
          address: data.data.address,
          businessActivities: data.data.businessActivities.join(', '),
          // Set president details from first director
          presidentFirstName: data.data.directors[0]?.name?.split(' ')[0] || '',
          presidentLastName: data.data.directors[0]?.name?.split(' ').slice(1).join(' ') || '',
        }));
        setCacLocked(true);
      } else {
        setCacError(data.error || 'Company not found in CAC database');
        setCacLocked(false);
      }
    } catch (err) {
      console.error('Error searching CAC:', err);
      setCacError('Failed to search CAC database');
    } finally {
      setCacSearching(false);
    }
  };

  const clearCACData = () => {
    setCacData(null);
    setCacSearchValue('');
    setCacError(null);
    setCacLocked(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check for email errors before submission
    if (emailError) {
      setError('Please fix the email error before submitting');
      setLoading(false);
      return;
    }

    try {
      const url = organization 
        ? `/api/admin/parent-organizations/${organization.id}`
        : '/api/admin/parent-organizations';
      
      const method = organization ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save organization');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* CAC Integration Banner - Updated 2024-01-27 */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg mb-6 text-center">
            <h3 className="text-lg font-bold">🏢 CAC INTEGRATION ACTIVE!</h3>
            <p className="text-sm">Search and verify companies with Korapay - {new Date().toLocaleTimeString()}</p>
          </div>
          
          <h2 className="text-xl font-semibold mb-4">
            {organization ? 'Edit Organization' : 'Create Organization'}
            <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
              ✨ CAC Integration Added
            </span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Skip Lookup Toggle */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipLookup}
                  onChange={(e) => {
                    setSkipLookup(e.target.checked);
                    if (e.target.checked) {
                      setCacLocked(false);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Skip CAC Lookup - Allow Direct Input
                </span>
                <span className="ml-2 text-xs text-gray-500">(Super Admin only)</span>
              </label>
              <p className="text-xs text-gray-600 mt-1 ml-6">
                When enabled, you can directly input data without performing CAC lookup
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                readOnly={cacLocked && !skipLookup}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter organization name"
              />
            </div>

            {/* CAC Search Section */}
            {!skipLookup && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 shadow-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🏢</span>
                CAC Registration Search
                <span className="ml-2 text-sm text-gray-500 font-normal">(Optional)</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Powered by Korapay
                </span>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  NEW!
                </span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search Type
                    </label>
                    <select
                      value={cacSearchType}
                      onChange={(e) => setCacSearchType(e.target.value as 'rc' | 'name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="rc">RC Number</option>
                      <option value="name">Company Name</option>
                    </select>
                  </div>
                  
                  <div className="flex-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {cacSearchType === 'rc' ? 'RC Number' : 'Company Name'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cacSearchValue}
                        onChange={(e) => setCacSearchValue(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={cacSearchType === 'rc' ? 'Enter RC Number' : 'Enter Company Name'}
                      />
                      <button
                        type="button"
                        onClick={searchCAC}
                        disabled={cacSearching || !cacSearchValue.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cacSearching ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                  </div>
                </div>

                {cacError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{cacError}</p>
                  </div>
                )}

                {cacData && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <h4 className="font-medium text-green-800">Company Found!</h4>
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Verified by Korapay
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={clearCACData}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Clear
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Company Name:</span>
                        <p className="text-gray-900">{cacData.companyName}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">RC Number:</span>
                        <p className="text-gray-900">{cacData.rcNumber}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Company Type:</span>
                        <p className="text-gray-900">{cacData.companyType}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <p className="text-gray-900">{cacData.status}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">Address:</span>
                        <p className="text-gray-900">{cacData.address}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">Business Activities:</span>
                        <p className="text-gray-900">{cacData.businessActivities.join(', ')}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-green-600">
                        ✓ Form has been auto-populated with CAC data. You can modify any fields as needed.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Brief description of the organization"
              />
            </div>

            {/* CAC Details Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">CAC Registration Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RC Number
                  </label>
                  <input
                    type="text"
                    value={formData.rcNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, rcNumber: e.target.value }))}
                    readOnly={cacLocked && !skipLookup}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Enter RC Number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Type
                  </label>
                  <input
                    type="text"
                    value={formData.companyType}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyType: e.target.value }))}
                    readOnly={cacLocked && !skipLookup}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="e.g., Private Company Limited by Shares"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Date
                  </label>
                  <input
                    type="date"
                    value={formData.registrationDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, registrationDate: e.target.value }))}
                    readOnly={cacLocked && !skipLookup}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Activities
                  </label>
                  <input
                    type="text"
                    value={formData.businessActivities}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessActivities: e.target.value }))}
                    readOnly={cacLocked && !skipLookup}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="e.g., General trading, Real estate development"
                  />
                </div>
              </div>
            </div>

            {/* President Details Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">President Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    President First Name *
                  </label>
                    <input
                      type="text"
                      required
                      value={formData.presidentFirstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, presidentFirstName: e.target.value }))}
                      readOnly={cacLocked && !skipLookup}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="Enter president's first name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      President Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.presidentLastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, presidentLastName: e.target.value }))}
                      readOnly={cacLocked && !skipLookup}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      placeholder="Enter president's last name"
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    President Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.presidentEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, presidentEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter president's email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    President Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.presidentPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, presidentPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter president's phone number"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email *
                </label>
                <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, contactEmail: e.target.value }));
                      // Debounce email check
                      setTimeout(() => checkEmailAvailability(e.target.value), 500);
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      emailError 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                    placeholder="Enter organization contact email"
                  />
                  {checkingEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                    </div>
                  )}
                </div>
                {emailError && (
                  <p className="text-red-600 text-sm mt-1">{emailError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                readOnly={cacLocked && !skipLookup}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank *
                  </label>
                  <select
                    required
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={loadingBanks}
                  >
                    <option value="">{loadingBanks ? 'Loading banks...' : 'Select a bank'}</option>
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.name}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter bank account number"
                    pattern="[0-9]{10}"
                    title="Bank account number must be 10 digits"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.bankAccountName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankAccountName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter bank account name (should match organization name)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The account name should match the organization name: <strong>{formData.name || 'Organization Name'}</strong>
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !!emailError || checkingEmail}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (organization ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
