'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CreateCooperativePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    companyType: '',
    registrationDate: '',
    tin: '',
    vatNumber: '',
    leaderFirstName: '',
    leaderLastName: '',
    leaderEmail: '',
    leaderPhone: '',
    leaderPassword: '',
    leaderTitle: '',
    leaderNIN: '',
    leaderBankName: '',
    leaderBankAccountNumber: '',
    leaderBankAccountName: '',
    parentOrganizationId: ''
  });

  const [cacSearching, setCacSearching] = useState(false);
  const [cacError, setCacError] = useState<string | null>(null);
  const [cacLocked, setCacLocked] = useState(false);
  const [ninSearching, setNinSearching] = useState(false);
  const [ninError, setNinError] = useState<string | null>(null);
  const [ninLocked, setNinLocked] = useState(false);
  const [skipLookup, setSkipLookup] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
        setCacLocked(true);
      } else {
        setCacError(data?.error || 'Company not found');
      }
    } catch (e:any) {
      setCacError(e.message || 'Lookup failed');
    } finally {
      setCacSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
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
        parentOrganizationId: formData.parentOrganizationId,
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
    } catch (err:any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchNIN = async () => {
    if (!formData.leaderNIN || !/^\d{11}$/.test(formData.leaderNIN)) {
      setNinError('Enter a valid 11-digit NIN');
      return;
    }
    try {
      setNinSearching(true);
      setNinError(null);
      const res = await fetch('/api/identity/nin/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nin: formData.leaderNIN, provider: 'korapay' })
      });
      const data = await res.json();
      if (data?.success && data.data) {
        const d = data.data;
        setFormData(prev => ({
          ...prev,
          leaderFirstName: d.firstName || prev.leaderFirstName,
          leaderLastName: d.lastName || prev.leaderLastName,
          leaderPhone: d.phoneNumber || prev.leaderPhone,
          address: prev.address || d.address || prev.address,
          city: prev.city || d.city || prev.city,
          state: prev.state || d.state || prev.state,
        }));
        setNinLocked(true);
      } else {
        setNinError(data?.message || 'NIN not found');
      }
    } catch (e:any) {
      setNinError(e.message || 'NIN lookup failed');
    } finally {
      setNinSearching(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add Cooperative</h1>
        <Link href="/dashboard/super-admin/cooperatives" className="text-blue-600 hover:underline">&larr; Back</Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded shadow p-6">
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
                  setNinLocked(false);
                }
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Skip CAC/NIN Lookup - Allow Direct Input
            </span>
            <span className="ml-2 text-xs text-gray-500">(Super Admin only)</span>
          </label>
          <p className="text-xs text-gray-600 mt-1 ml-6">
            When enabled, you can directly input data without performing CAC or NIN lookups
          </p>
        </div>

        {!skipLookup && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700">RC Number (optional)</label>
                <input type="text" name="rcNumber" value={formData.rcNumber} onChange={handleChange} placeholder="e.g., RC00000011 or 00000011" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button type="button" onClick={searchCAC} disabled={cacSearching || !formData.rcNumber} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50">
                  {cacSearching ? 'Searching…' : 'Lookup CAC'}
                </button>
                {cacError && <span className="text-sm text-red-600">{cacError}</span>}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cooperative Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required readOnly={cacLocked && !skipLookup} className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Registration Number *</label>
            <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} required readOnly={cacLocked && !skipLookup} className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Address *</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange} required readOnly={cacLocked && !skipLookup} className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">City *</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} required readOnly={cacLocked && !skipLookup} className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State *</label>
            <input type="text" name="state" value={formData.state} onChange={handleChange} required readOnly={cacLocked && !skipLookup} className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
            <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required readOnly={cacLocked && !skipLookup} className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required readOnly={cacLocked && !skipLookup} className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Website</label>
            <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Person</label>
            <input type="text" name="contactName" value={formData.contactName} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Email</label>
            <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} readOnly={cacLocked && !skipLookup} className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
            <input type="text" name="contactPhone" value={formData.contactPhone} onChange={handleChange} readOnly={cacLocked && !skipLookup} className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Bank Name *</label>
            <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} required className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bank Account Number *</label>
            <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} required className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Bank Account Name *</label>
            <input type="text" name="bankAccountName" value={formData.bankAccountName} onChange={handleChange} required className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Parent Organization ID (optional)</label>
            <input type="text" name="parentOrganizationId" value={formData.parentOrganizationId} onChange={handleChange} placeholder="Link to parent organization" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
          </div>
        </div>

        <div className="mt-6 p-4 border rounded">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Leader Details</h3>
          {!skipLookup && (
            <div className="p-3 mb-3 bg-blue-50 border border-blue-200 rounded">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Leader NIN</label>
                  <input type="text" name="leaderNIN" value={(formData as any).leaderNIN || ''} onChange={(e)=>setFormData(prev=>({ ...prev, leaderNIN: e.target.value }))} placeholder="11-digit NIN" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button type="button" onClick={searchNIN} disabled={ninSearching || !(formData as any).leaderNIN} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">{ninSearching ? 'Verifying…' : 'Lookup NIN'}</button>
                  {ninError && <span className="text-sm text-red-600">{ninError}</span>}
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input type="text" name="leaderFirstName" value={formData.leaderFirstName} onChange={handleChange} required readOnly={ninLocked && !skipLookup} className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${ninLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input type="text" name="leaderLastName" value={formData.leaderLastName} onChange={handleChange} required readOnly={ninLocked && !skipLookup} className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${ninLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input type="text" name="leaderTitle" value={formData.leaderTitle} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input type="email" name="leaderEmail" value={formData.leaderEmail} onChange={handleChange} required className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone *</label>
              <input type="text" name="leaderPhone" value={formData.leaderPhone} onChange={handleChange} required readOnly={ninLocked && !skipLookup} className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${ninLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <input type="password" name="leaderPassword" value={formData.leaderPassword} onChange={handleChange} required className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Leader Bank Name</label>
              <input type="text" name="leaderBankName" value={formData.leaderBankName} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Leader Bank Account Number</label>
              <input type="text" name="leaderBankAccountNumber" value={formData.leaderBankAccountNumber} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Leader Bank Account Name</label>
              <input type="text" name="leaderBankAccountName" value={formData.leaderBankAccountName} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Initializing…' : 'Proceed to Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}


