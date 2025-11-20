'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { banks as fallbackBanks } from '@/lib/data';

interface CACCompanyData {
  companyName: string;
  rcNumber: string;
  companyType: string;
  registrationDate: string;
  status: string;
  address: string;
  state: string;
  lga: string;
  businessActivities: string[];
  directors: Array<{
    name: string;
    position: string;
    nationality: string;
  }>;
  shareholders: Array<{
    name: string;
    shares: number;
    percentage: number;
  }>;
  authorizedCapital: number;
  issuedCapital: number;
  paidUpCapital: number;
}

export default function CreateOrganizationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
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
    // Additional CAC fields
    tin: '',
    vatNumber: '',
    registryNumber: '',
    companyStatus: '',
    city: '',
    state: '',
    lga: '',
    branchAddress: '',
    objectives: '',
    shareCapitalInWords: '',
    paidUpCapital: '',
    subscribedShareCapital: '',
    sharesIssued: '',
    sharesValue: '',
    // Company contact persons
    companyContactName: '',
    companyContactEmail: '',
    companyContactPhone: '',
    // Key personnel
    secretaryName: '',
    secretaryEmail: '',
    secretaryPhone: '',
    secretaryAddress: '',
    // Directors
    director1Name: '',
    director1Email: '',
    director1Phone: '',
    director1Address: '',
    director1Occupation: '',
    director1Nationality: '',
    // Shareholders
    shareholder1Name: '',
    shareholder1Shares: '',
    shareholder1Percentage: '',
    shareholder1Address: '',
    shareholder1Nationality: '',
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
  const [cacData, setCacData] = useState<CACCompanyData | null>(null);
  const [cacError, setCacError] = useState<string | null>(null);
  const [cacLocked, setCacLocked] = useState(false);
  const [skipLookup, setSkipLookup] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
    
    fetchBanks();
  }, [session, status]);

  const fetchBanks = async () => {
    try {
      setLoadingBanks(true);
      const response = await fetch('/api/banks/list');
      if (!response.ok) throw new Error('Failed to fetch banks');
      const data = await response.json();
      
      // If database has banks, use them; otherwise use fallback static list
      if (data.banks && data.banks.length > 0) {
        setBanks(data.banks);
      } else {
        // Fallback to static bank list if database is empty
        console.warn('No banks found in database, using fallback static list');
        setBanks(fallbackBanks);
      }
    } catch (err) {
      console.error('Error fetching banks:', err);
      // Use fallback static list on error
      setBanks(fallbackBanks);
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

    // Validate RC number format if searching by RC
    if (cacSearchType === 'rc') {
      const numericPart = cacSearchValue.replace(/[^0-9]/g, '');
      if (numericPart.length < 6) {
        setCacError('RC Number must contain at least 6 numeric characters');
        return;
      }
    }

    try {
      setCacSearching(true);
      setCacError(null);
      
      const response = await fetch('/api/identity/cac/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rcNumber: cacSearchType === 'rc' ? cacSearchValue : undefined,
          registrationType: 'RC'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Map the response data to our CAC data format
        const cacDisplayData = {
          companyName: data.data.name,
          rcNumber: data.data.registration_number,
          companyType: data.data.type_of_entity,
          registrationDate: data.data.registration_date?.split('T')[0] || '',
          status: data.data.company_status,
          address: data.data.address,
          state: data.data.state,
          lga: data.data.lga,
          businessActivities: [data.data.activity].filter(Boolean),
          directors: [], // Not available in this response
          shareholders: [], // Not available in this response
          authorizedCapital: 0,
          issuedCapital: 0,
          paidUpCapital: 0
        };
        
        setCacData(cacDisplayData);
        
        // Auto-populate form with CAC data
        const cacData = data.data;
        const directors = cacData.key_personnel?.filter(p => p.designation === 'DIRECTOR') || [];
        const shareholders = cacData.key_personnel?.filter(p => p.designation === 'SHAREHOLDER') || [];
        const secretaries = cacData.key_personnel?.filter(p => p.designation === 'SECRETARY_COMPANY') || [];
        const contactPersons = cacData.company_contact_persons || [];
        
        setFormData(prev => ({
          ...prev,
          // Basic company info
          name: cacData.name,
          rcNumber: cacData.registration_number,
          companyType: cacData.type_of_entity,
          registrationDate: cacData.registration_date?.split('T')[0] || '',
          address: cacData.address,
          businessActivities: cacData.activity || '',
          state: cacData.state,
          lga: cacData.lga,
          city: cacData.city,
          // Contact information from CAC data
          contactEmail: cacData.email || prev.contactEmail,
          contactPhone: cacData.phone_number || prev.contactPhone,
          // Additional CAC fields
          tin: cacData.tin || '',
          vatNumber: cacData.vat_number || '',
          registryNumber: cacData.registry_number || '',
          companyStatus: cacData.company_status || '',
          branchAddress: cacData.branch_address || '',
          objectives: cacData.objectives || '',
          shareCapitalInWords: cacData.share_capital_in_words || '',
          paidUpCapital: cacData.paid_share_capital || '',
          subscribedShareCapital: cacData.subscribed_share_capital || '',
          sharesIssued: cacData.shares_issued || '',
          sharesValue: cacData.shares_value || '',
          // Company contact persons
          companyContactName: contactPersons[0]?.name || '',
          companyContactEmail: contactPersons[0]?.contacts?.email?.[0] || '',
          companyContactPhone: contactPersons[0]?.contacts?.phone?.[0] || '',
          // Secretary details
          secretaryName: secretaries[0]?.name || '',
          secretaryEmail: secretaries[0]?.email || '',
          secretaryPhone: secretaries[0]?.phone_number || '',
          secretaryAddress: secretaries[0]?.address || '',
          // Director details
          director1Name: directors[0]?.name || '',
          director1Email: directors[0]?.email || '',
          director1Phone: directors[0]?.phone_number || '',
          director1Address: directors[0]?.address || '',
          director1Occupation: directors[0]?.occupation || '',
          director1Nationality: directors[0]?.nationality || '',
          // Shareholder details
          shareholder1Name: shareholders[0]?.name || '',
          shareholder1Shares: shareholders[0]?.shares_count || '',
          shareholder1Percentage: shareholders[0]?.shares_count ? 
            ((parseInt(shareholders[0].shares_count) / parseInt(cacData.shares_issued || '1')) * 100).toFixed(2) : '',
          shareholder1Address: shareholders[0]?.address || '',
          shareholder1Nationality: shareholders[0]?.nationality || '',
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
      const response = await fetch('/api/admin/parent-organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create organization');
      }

      router.push('/dashboard/apex/parent-organizations');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loadingBanks) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard/apex" className="hover:text-gray-700">
          Apex Dashboard
        </Link>
        <span>/</span>
        <Link href="/dashboard/apex/parent-organizations" className="hover:text-gray-700">
          Parent Organizations
        </Link>
        <span>/</span>
        <span className="text-gray-900">Create Organization</span>
      </nav>

      {/* CAC Integration Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-8 text-center shadow-lg">
        <h1 className="text-3xl font-bold mb-2">🏢 Create Organization with CAC Integration</h1>
        <p className="text-lg">Search and verify companies with Korapay before creating</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Skip Lookup Toggle */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
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

        {/* CAC Search Section */}
        {!skipLookup && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">🔍</span>
              CAC Registration Search
              <span className="ml-2 text-sm text-gray-500 font-normal">(Optional but Recommended)</span>
              <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Powered by Korapay
              </span>
              <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                NEW!
              </span>
            </h2>
            
            <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Type
                </label>
                <select
                  value={cacSearchType}
                  onChange={(e) => setCacSearchType(e.target.value as 'rc' | 'name')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                >
                  <option value="rc">RC Number</option>
                  <option value="name">Company Name</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {cacSearchType === 'rc' ? 'RC Number' : 'Company Name'}
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={cacSearchValue}
                    onChange={(e) => setCacSearchValue(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    placeholder={cacSearchType === 'rc' ? 'Enter RC Number (e.g., RC123456789)' : 'Enter Company Name'}
                  />
                  <button
                    type="button"
                    onClick={searchCAC}
                    disabled={cacSearching || !cacSearchValue.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {cacSearching ? 'Searching...' : 'Search CAC'}
                  </button>
                </div>
                {cacSearchType === 'rc' && (
                  <p className="text-sm text-gray-500 mt-2">
                    💡 RC Number format: RC followed by numbers (e.g., RC123456789)
                  </p>
                )}
              </div>
            </div>

            {cacError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 font-medium">{cacError}</p>
              </div>
            )}

            {cacData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-green-800">✅ Company Found!</h3>
                    <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      Verified by Korapay
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearCACData}
                    className="text-green-600 hover:text-green-800 font-medium"
                  >
                    Clear & Search Again
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Company Name:</span>
                    <p className="text-gray-900 font-medium">{cacData.companyName}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">RC Number:</span>
                    <p className="text-gray-900 font-medium">{cacData.rcNumber}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Company Type:</span>
                    <p className="text-gray-900">{cacData.companyType}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Status:</span>
                    <p className="text-gray-900">{cacData.status}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">State:</span>
                    <p className="text-gray-900">{cacData.state}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">LGA:</span>
                    <p className="text-gray-900">{cacData.lga}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-semibold text-gray-700">Address:</span>
                    <p className="text-gray-900">{cacData.address}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-semibold text-gray-700">Business Activities:</span>
                    <p className="text-gray-900">{cacData.businessActivities.join(', ')}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-sm text-green-600 font-medium">
                    ✨ Form has been auto-populated with CAC data. You can modify any fields as needed.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Organization Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Organization Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                readOnly={cacLocked && !skipLookup}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter organization name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => {
                    if (cacLocked) return;
                    setFormData(prev => ({ ...prev, contactEmail: e.target.value }));
                    setTimeout(() => checkEmailAvailability(e.target.value), 500);
                  }}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    emailError 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  } ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter organization contact email"
                />
                {checkingEmail && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
              {emailError && (
                <p className="text-red-600 text-sm mt-1">{emailError}</p>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Phone *
              </label>
              <input
                type="tel"
                required
                value={formData.contactPhone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                  if (value.length <= 11) {
                    setFormData(prev => ({ ...prev, contactPhone: value }));
                  }
                }}
                minLength={11}
                maxLength={11}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="08012345678"
              />
              <p className="text-xs text-gray-600 mt-1">Must be exactly 11 digits (e.g., 08012345678)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter organization address"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Brief description of the organization"
            />
          </div>
        </div>

        {/* CAC Details Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">CAC Registration Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RC Number
              </label>
              <input
                type="text"
                value={formData.rcNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, rcNumber: e.target.value }))}
                readOnly={cacLocked && !skipLookup}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter RC Number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Type
              </label>
              <input
                type="text"
                value={formData.companyType}
                onChange={(e) => setFormData(prev => ({ ...prev, companyType: e.target.value }))}
                readOnly={cacLocked && !skipLookup}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="e.g., Private Company Limited by Shares"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Date
              </label>
              <input
                type="date"
                value={formData.registrationDate}
                onChange={(e) => setFormData(prev => ({ ...prev, registrationDate: e.target.value }))}
                readOnly={cacLocked && !skipLookup}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Activities
              </label>
              <input
                type="text"
                value={formData.businessActivities}
                onChange={(e) => setFormData(prev => ({ ...prev, businessActivities: e.target.value }))}
                readOnly={cacLocked && !skipLookup}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="e.g., General trading, Real estate development"
              />
            </div>
          </div>
          
          {/* Additional CAC Information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Company Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TIN (Tax Identification Number)
                </label>
                <input
                  type="text"
                  value={formData.tin}
                  onChange={(e) => setFormData(prev => ({ ...prev, tin: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter TIN"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VAT Number
                </label>
                <input
                  type="text"
                  value={formData.vatNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, vatNumber: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter VAT Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registry Number
                </label>
                <input
                  type="text"
                  value={formData.registryNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, registryNumber: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter Registry Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Status
                </label>
                <input
                  type="text"
                  value={formData.companyStatus}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyStatus: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="e.g., ACTIVE, INACTIVE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LGA (Local Government Area)
                </label>
                <input
                  type="text"
                  value={formData.lga}
                  onChange={(e) => setFormData(prev => ({ ...prev, lga: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter LGA"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch Address
              </label>
              <textarea
                value={formData.branchAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, branchAddress: e.target.value }))}
                readOnly={cacLocked && !skipLookup}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                rows={2}
                placeholder="Enter branch address"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Objectives
              </label>
              <textarea
                value={formData.objectives}
                onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                readOnly={cacLocked && !skipLookup}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                rows={3}
                placeholder="Enter company objectives"
              />
            </div>
          </div>

          {/* Share Capital Information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Capital Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Capital (in words)
                </label>
                <input
                  type="text"
                  value={formData.shareCapitalInWords}
                  onChange={(e) => setFormData(prev => ({ ...prev, shareCapitalInWords: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="e.g., TEN MILLION NAIRA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paid Up Capital
                </label>
                <input
                  type="text"
                  value={formData.paidUpCapital}
                  onChange={(e) => setFormData(prev => ({ ...prev, paidUpCapital: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter paid up capital"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subscribed Share Capital
                </label>
                <input
                  type="text"
                  value={formData.subscribedShareCapital}
                  onChange={(e) => setFormData(prev => ({ ...prev, subscribedShareCapital: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter subscribed share capital"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shares Issued
                </label>
                <input
                  type="text"
                  value={formData.sharesIssued}
                  onChange={(e) => setFormData(prev => ({ ...prev, sharesIssued: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter shares issued"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Value
                </label>
                <input
                  type="text"
                  value={formData.sharesValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, sharesValue: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="e.g., 0.01 NGN"
                />
              </div>
            </div>
          </div>

          {/* Company Contact Persons */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Contact Persons</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  value={formData.companyContactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyContactName: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter contact person name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person Email
                </label>
                <input
                  type="email"
                  value={formData.companyContactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyContactEmail: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter contact person email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person Phone
                </label>
                <input
                  type="tel"
                  value={formData.companyContactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyContactPhone: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter contact person phone"
                />
              </div>
            </div>
          </div>

          {/* Key Personnel - Secretary */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Secretary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secretary Name
                </label>
                <input
                  type="text"
                  value={formData.secretaryName}
                  onChange={(e) => setFormData(prev => ({ ...prev, secretaryName: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter secretary name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secretary Email
                </label>
                <input
                  type="email"
                  value={formData.secretaryEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, secretaryEmail: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter secretary email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secretary Phone
                </label>
                <input
                  type="tel"
                  value={formData.secretaryPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, secretaryPhone: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter secretary phone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secretary Address
                </label>
                <input
                  type="text"
                  value={formData.secretaryAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, secretaryAddress: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter secretary address"
                />
              </div>
            </div>
          </div>

          {/* Directors */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Directors</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Director 1 Name
                </label>
                <input
                  type="text"
                  value={formData.director1Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, director1Name: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter director name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Director 1 Email
                </label>
                <input
                  type="email"
                  value={formData.director1Email}
                  onChange={(e) => setFormData(prev => ({ ...prev, director1Email: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter director email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Director 1 Phone
                </label>
                <input
                  type="tel"
                  value={formData.director1Phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, director1Phone: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter director phone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Director 1 Address
                </label>
                <input
                  type="text"
                  value={formData.director1Address}
                  onChange={(e) => setFormData(prev => ({ ...prev, director1Address: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter director address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Director 1 Occupation
                </label>
                <input
                  type="text"
                  value={formData.director1Occupation}
                  onChange={(e) => setFormData(prev => ({ ...prev, director1Occupation: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter director occupation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Director 1 Nationality
                </label>
                <input
                  type="text"
                  value={formData.director1Nationality}
                  onChange={(e) => setFormData(prev => ({ ...prev, director1Nationality: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter director nationality"
                />
              </div>
            </div>
          </div>

          {/* Shareholders */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shareholders</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shareholder 1 Name
                </label>
                <input
                  type="text"
                  value={formData.shareholder1Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, shareholder1Name: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter shareholder name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shareholder 1 Shares
                </label>
                <input
                  type="text"
                  value={formData.shareholder1Shares}
                  onChange={(e) => setFormData(prev => ({ ...prev, shareholder1Shares: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter number of shares"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shareholder 1 Percentage
                </label>
                <input
                  type="text"
                  value={formData.shareholder1Percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, shareholder1Percentage: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter percentage ownership"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shareholder 1 Address
                </label>
                <input
                  type="text"
                  value={formData.shareholder1Address}
                  onChange={(e) => setFormData(prev => ({ ...prev, shareholder1Address: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter shareholder address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shareholder 1 Nationality
                </label>
                <input
                  type="text"
                  value={formData.shareholder1Nationality}
                  onChange={(e) => setFormData(prev => ({ ...prev, shareholder1Nationality: e.target.value }))}
                  readOnly={cacLocked && !skipLookup}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter shareholder nationality"
                />
              </div>
            </div>
          </div>
        </div>

        {/* President Details Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">President Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                President First Name *
              </label>
              <input
                type="text"
                required
                value={formData.presidentFirstName}
                onChange={(e) => setFormData(prev => ({ ...prev, presidentFirstName: e.target.value }))}
                readOnly={cacLocked && !skipLookup}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter president's first name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                President Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.presidentLastName}
                onChange={(e) => setFormData(prev => ({ ...prev, presidentLastName: e.target.value }))}
                readOnly={cacLocked && !skipLookup}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${cacLocked && !skipLookup ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter president's last name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                President Email *
              </label>
              <input
                type="email"
                required
                value={formData.presidentEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, presidentEmail: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter president's email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                President Phone *
              </label>
              <input
                type="tel"
                required
                value={formData.presidentPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, presidentPhone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter president's phone number"
              />
            </div>
          </div>
        </div>

        {/* Bank Details Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Bank Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank *
              </label>
              <select
                required
                value={formData.bankName}
                onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account Number *
              </label>
              <input
                type="text"
                required
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter bank account number"
                pattern="[0-9]{10}"
                title="Bank account number must be 10 digits"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account Name *
              </label>
              <input
                type="text"
                required
                value={formData.bankAccountName}
                onChange={(e) => setFormData(prev => ({ ...prev, bankAccountName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter bank account name (should match organization name)"
              />
              <p className="text-sm text-gray-500 mt-1">
                The account name should match the organization name: <strong>{formData.name || 'Organization Name'}</strong>
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        <div className="flex justify-between items-center pt-6">
          <Link
            href="/dashboard/apex/parent-organizations"
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
          >
            ← Back to Organizations
          </Link>
          <button
            type="submit"
            disabled={loading || !!emailError || checkingEmail}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-lg"
          >
            {loading ? 'Creating Organization...' : 'Create Organization'}
          </button>
        </div>
      </form>
    </div>
  );
}
