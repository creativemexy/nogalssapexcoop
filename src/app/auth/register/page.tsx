'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { states } from '@/lib/data';
import Image from 'next/image';
import PasswordInput from '@/components/ui/PasswordInput';
import PasswordHints from '@/components/ui/PasswordHints';

type RegistrationType = 'MEMBER' | 'COOPERATIVE';

export default function RegisterPage() {
    const router = useRouter();
    const [registrationType, setRegistrationType] = useState<RegistrationType | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        // Member fields
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        cooperativeCode: '',
        cooperativeName: '',
        nin: '',
        dateOfBirth: '',
        occupation: '',
        address: '',
        city: '',
        lga: '',
        state: '',
        phoneNumber: '',
        nextOfKinName: '',
        nextOfKinPhone: '',
        emergencyContact: '',
        emergencyPhone: '',
        savingAmount: '',
        savingFrequency: '',
        // Cooperative fields
        cooperativeRegNo: '',
        cooperativeRegType: 'RC', // Default to RC
        bankName: '',
        bankAccountNumber: '',
        phone: '',
        cooperativeEmail: '',
        
        // Leader fields
        leaderFirstName: '',
        leaderLastName: '',
        leaderEmail: '',
        leaderPassword: '',
        leaderPhone: '',
        leaderTitle: '',
        leaderNin: '',
        leaderBankName: '',
        leaderBankAccountNumber: '',
        leaderBankAccountName: '',
        bankAccountName: '',
        parentOrganizationId: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [ninLookupLoading, setNinLookupLoading] = useState(false);
    const [ninLookupError, setNinLookupError] = useState<string | null>(null);
    const [registrationFee, setRegistrationFee] = useState<string>('Loading...');
    const [ninLocked, setNinLocked] = useState(false);
    const [ninPhoto, setNinPhoto] = useState<string>('');
    const [cacLookupLoading, setCacLookupLoading] = useState(false);
    const [cacLookupError, setCacLookupError] = useState<string | null>(null);
    const [leaderNinLookupLoading, setLeaderNinLookupLoading] = useState(false);
    const [leaderNinLookupError, setLeaderNinLookupError] = useState<string | null>(null);
    const [leaderNinLocked, setLeaderNinLocked] = useState(false);
    const [leaderNinPhoto, setLeaderNinPhoto] = useState<string>('');
    const [resolvingLeaderAccount, setResolvingLeaderAccount] = useState(false);
    const [leaderAccountResolutionError, setLeaderAccountResolutionError] = useState<string | null>(null);
    const [cacLocked, setCacLocked] = useState(false);
    const [cooperatives, setCooperatives] = useState<{ code: string; name: string }[]>([]);
    const [loadingCooperatives, setLoadingCooperatives] = useState(false);
    const [occupations, setOccupations] = useState<{ id: string; name: string }[]>([]);
    const [loadingOccupations, setLoadingOccupations] = useState(false);
    const [memberStep, setMemberStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [parentOrganizations, setParentOrganizations] = useState<{ id: string; name: string; description?: string }[]>([]);
    const [loadingParentOrganizations, setLoadingParentOrganizations] = useState(false);
    const [banks, setBanks] = useState<{ id: string; name: string; code: string }[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(false);
    const [resolvingAccount, setResolvingAccount] = useState(false);
    const [accountResolutionError, setAccountResolutionError] = useState<string | null>(null);


    useEffect(() => {
        fetchRegistrationFee();
        fetchOccupations(); // Always fetch occupations
        fetchBanks(); // Always fetch banks
        if (registrationType === 'MEMBER') {
            fetchCooperatives();
        } else if (registrationType === 'COOPERATIVE') {
            fetchParentOrganizations();
        }
    }, [registrationType]);

    // Retry mechanism for cooperatives
    useEffect(() => {
        if (registrationType === 'MEMBER' && cooperatives.length === 0 && !loadingCooperatives) {
            const retryTimer = setTimeout(() => {
                console.log('Retrying cooperative fetch...');
                fetchCooperatives();
            }, 2000);
            return () => clearTimeout(retryTimer);
        }
    }, [registrationType, cooperatives.length, loadingCooperatives]);

    const fetchRegistrationFee = async () => {
        try {
            let endpoint = '/api/public/registration-fee'; // Default fallback
            
            if (registrationType === 'MEMBER') {
                endpoint = '/api/public/member-registration-fee';
            } else if (registrationType === 'COOPERATIVE') {
                endpoint = '/api/public/cooperative-registration-fee';
            }
            
            const response = await fetch(endpoint);
            const data = await response.json();
            if (response.ok) {
                setRegistrationFee(data.registrationFeeFormatted);
            } else {
                setRegistrationFee('Fee unavailable');
            }
        } catch (err) {
            console.error('Failed to fetch registration fee:', err);
            setRegistrationFee('Fee unavailable');
        }
    };

    const handleCACLookup = async () => {
        if (!formData.cooperativeRegNo) {
            setCacLookupError('Please enter a valid RC Number');
            return;
        }

        // Validate RC number format (should contain numeric characters)
        const numericPart = formData.cooperativeRegNo.replace(/[^0-9]/g, '');
        if (numericPart.length < 6) {
            setCacLookupError('RC Number must contain at least 6 numeric characters');
            return;
        }

        setCacLookupLoading(true);
        setCacLookupError(null);

        try {
            const response = await fetch('/api/identity/cac/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    rcNumber: formData.cooperativeRegNo,
                    registrationType: formData.cooperativeRegType 
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'CAC lookup failed');
            }

            // Populate form with CAC data
            setFormData(prev => ({
                ...prev,
                cooperativeName: data.data.name || '', // Use 'name' instead of 'company_name'
                cooperativeRegNo: data.data.registration_number || '', // Use 'registration_number' instead of 'rc_number'
                address: data.data.address || '',
                city: data.data.city || '',
                state: data.data.state || '', // This should now work
                lga: data.data.lga || '', // This should now work
                phone: data.data.phone_number || '',
                cooperativeEmail: data.data.email || '',
            }));

            setCacLocked(true);
            console.log('✅ CAC lookup successful:', data.data.name);

        } catch (err: any) {
            console.error('CAC lookup error:', err);
            setCacLookupError(err.message);
            setCacLocked(false);
        } finally {
            setCacLookupLoading(false);
        }
    };

    const fetchCooperatives = async () => {
        try {
            setLoadingCooperatives(true);
            console.log('Fetching cooperatives...');
            
            const response = await fetch('/api/public/cooperatives', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                cache: 'no-store'
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Cooperatives data:', data);
            
            if (data.cooperatives && Array.isArray(data.cooperatives)) {
                setCooperatives(data.cooperatives);
                console.log('Cooperatives loaded:', data.cooperatives.length);
            } else {
                console.warn('No cooperatives found in response');
                setCooperatives([]);
            }
        } catch (err) {
            console.error('Failed to fetch cooperatives:', err);
            setCooperatives([]);
            // Show user-friendly error message
            alert('Failed to load cooperatives. Please refresh the page and try again.');
        } finally {
            setLoadingCooperatives(false);
        }
    };

    const fetchOccupations = async () => {
        try {
            setLoadingOccupations(true);
            console.log('Fetching occupations...');
            
            const response = await fetch('/api/occupations', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                cache: 'no-store'
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Occupations data:', data);
            
            if (data.occupations && Array.isArray(data.occupations)) {
                setOccupations(data.occupations);
                console.log('Occupations loaded:', data.occupations.length);
            } else {
                console.warn('No occupations found in response');
                setOccupations([]);
            }
        } catch (err) {
            console.error('Failed to fetch occupations:', err);
            setOccupations([]);
        } finally {
            setLoadingOccupations(false);
        }
    };

    const fetchParentOrganizations = async () => {
        try {
            setLoadingParentOrganizations(true);
            console.log('Fetching parent organizations...');
            
            const response = await fetch('/api/public/parent-organizations', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                cache: 'no-store'
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Parent organizations data:', data);
            
            if (data.parentOrganizations && Array.isArray(data.parentOrganizations)) {
                setParentOrganizations(data.parentOrganizations);
                console.log('Parent organizations loaded:', data.parentOrganizations.length);
            } else {
                console.warn('No parent organizations found in response');
                setParentOrganizations([]);
            }
        } catch (err) {
            console.error('Failed to fetch parent organizations:', err);
            setParentOrganizations([]);
        } finally {
            setLoadingParentOrganizations(false);
        }
    };

    const fetchBanks = async () => {
        try {
            setLoadingBanks(true);
            console.log('Fetching banks...');
            
            const response = await fetch('/api/banks/list', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch banks');
            }

            const data = await response.json();
            console.log('Banks fetched successfully:', data.banks.length);
            setBanks(data.banks);
        } catch (error) {
            console.error('Error fetching banks:', error);
            setError('Failed to load banks. Please refresh the page.');
        } finally {
            setLoadingBanks(false);
        }
    };

    const resolveAccountName = async (bankCode: string, accountNumber: string) => {
        try {
            setResolvingAccount(true);
            setAccountResolutionError(null);
            console.log('Resolving account name for:', { bankCode, accountNumber });

            const response = await fetch('/api/paystack/resolve-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bankCode,
                    accountNumber
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log('Account name resolved:', data.accountName);
                setFormData(prev => ({
                    ...prev,
                    bankAccountName: data.accountName
                }));
                setAccountResolutionError(null); // Clear any previous errors
            } else {
                // Handle fallback case where user needs to enter account name manually
                if (data.fallback) {
                    setAccountResolutionError('Account verification service is unavailable. Please enter your account name manually.');
                } else {
                    setAccountResolutionError(data.error || 'Failed to resolve account name');
                }
            }
        } catch (error) {
            console.error('Error resolving account name:', error);
            setAccountResolutionError('Failed to resolve account name. Please try again.');
        } finally {
            setResolvingAccount(false);
        }
    };

    const resolveLeaderAccountName = async (bankCode: string, accountNumber: string) => {
        try {
            setResolvingLeaderAccount(true);
            setLeaderAccountResolutionError(null);
            console.log('Resolving leader account name for:', { bankCode, accountNumber });

            const response = await fetch('/api/paystack/resolve-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bankCode,
                    accountNumber
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log('Leader account name resolved:', data.accountName);
                setFormData(prev => ({
                    ...prev,
                    leaderBankAccountName: data.accountName
                }));
                setLeaderAccountResolutionError(null); // Clear any previous errors
            } else {
                // Handle fallback case where user needs to enter account name manually
                if (data.fallback) {
                    setLeaderAccountResolutionError('Account verification service is unavailable. Please enter your account name manually.');
                } else {
                    setLeaderAccountResolutionError(data.error || 'Failed to resolve account name');
                }
            }
        } catch (error) {
            console.error('Error resolving leader account name:', error);
            setLeaderAccountResolutionError('Failed to resolve account name. Please try again.');
        } finally {
            setResolvingLeaderAccount(false);
        }
    };

    const handleTypeSelect = (type: RegistrationType) => {
        setRegistrationType(type);
        setError(null);
        setSuccess(null);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (registrationType === 'COOPERATIVE' && currentStep < 3) {
            nextStep();
            return;
        }
        
        if (registrationType === 'MEMBER' && memberStep < 3) {
            setMemberStep(memberStep + 1);
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        if (registrationType === 'MEMBER' && formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        if (!acceptedTerms && ((registrationType === 'COOPERATIVE' && currentStep >= 3) || (registrationType === 'MEMBER' && memberStep >= 3))) {
            setError('You must read and agree to the Terms & Conditions to continue.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, registrationType, acceptedTerms: true }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed.');
            }
            
            // Handle different registration types
            if (registrationType === 'COOPERATIVE') {
                // For cooperative registration, redirect to payment
                if (data.payment && data.payment.authorizationUrl) {
                    // Store registration data for after payment
                    localStorage.setItem('cooperativeRegistration', JSON.stringify({
                        accounts: data.accounts,
                        virtualAccounts: data.virtualAccounts,
                        cooperativeName: formData.cooperativeName
                    }));
                    
                    // Redirect to Paystack payment
                    window.location.href = data.payment.authorizationUrl;
                    return;
                } else {
                    throw new Error('Payment initialization failed');
                }
            } else if (registrationType === 'MEMBER') {
                // For member registration, redirect to payment
                if (data.payment && data.payment.authorizationUrl) {
                    // Store registration data for after payment
                    localStorage.setItem('memberRegistration', JSON.stringify({
                        accounts: data.accounts,
                        virtualAccounts: data.virtualAccounts,
                        memberName: `${formData.firstName} ${formData.lastName}`
                    }));
                    
                    // Redirect to Paystack payment
                    window.location.href = data.payment.authorizationUrl;
                    return;
                } else {
                    throw new Error('Payment initialization failed');
                }
            }
            
            setSuccess(data.message);
            setTimeout(() => router.push('/auth/signin'), 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNinBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const nin = e.target.value.trim();
        setNinLookupError(null);
        if (!nin || nin.length !== 11) return;
        setNinLookupLoading(true);
        try {
            const res = await fetch('/api/lookup/nin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nin }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'NIN lookup failed');
            setFormData(prev => ({
                ...prev,
                firstName: data.name?.split(' ')[0] || '',
                lastName: data.name?.split(' ').slice(1).join(' ') || '',
                dateOfBirth: data.dateOfBirth || '',
            }));
            setNinLocked(true);
        } catch (err: any) {
            setNinLookupError(err.message);
            setNinLocked(false);
        } finally {
            setNinLookupLoading(false);
        }
    };

    const renderCooperativeForm = () => {
        const selectedState = states.find(s => s.name === formData.state);

        switch(currentStep) {
            case 1:
                return (
                    <div>
                        {/* Registration Fee Information */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Registration Fee</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">One-time registration fee for cooperative registration</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-blue-600">{registrationFee}</p>
                                    <p className="text-xs text-blue-500">Payable via Paystack</p>
                                </div>
                            </div>
                        </div>
                        
                        <h3 className="text-xl font-semibold border-b pb-2">Step 1: Organization Details</h3>
                        <div className="space-y-4 mt-4">
                            <div>
                                <label htmlFor="parentOrganizationId" className="block text-sm font-medium">Parent Organization *</label>
                                {loadingParentOrganizations ? (
                                    <div className="w-full mt-1 p-3 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center">
                                        <span className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></span>
                                        <span className="text-sm text-gray-600">Loading parent organizations...</span>
                                    </div>
                                ) : parentOrganizations.length === 0 ? (
                                    <div className="w-full mt-1 p-3 border border-red-300 rounded-md bg-red-50">
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                            <span className="text-sm text-red-600">No parent organizations available</span>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={fetchParentOrganizations}
                                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                                        >
                                            Try again
                                        </button>
                                    </div>
                                ) : (
                                    <select
                                        id="parentOrganizationId"
                                        name="parentOrganizationId"
                                        value={formData.parentOrganizationId}
                                        onChange={handleChange}
                                        required
                                        className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                                        style={{ 
                                            WebkitAppearance: 'none',
                                            MozAppearance: 'none',
                                            appearance: 'none',
                                            backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'right 12px center',
                                            backgroundSize: '16px',
                                            paddingRight: '40px'
                                        }}
                                    >
                                        <option value="">Select parent organization</option>
                                        {parentOrganizations.map((org) => (
                                            <option key={org.id} value={org.id}>
                                                {org.name} {org.description && `- ${org.description}`}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs text-gray-600">
                                        Choose the parent organization this cooperative belongs to.
                                    </p>
                                    <button 
                                        type="button"
                                        onClick={fetchParentOrganizations}
                                        disabled={loadingParentOrganizations}
                                        className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                                    >
                                        {loadingParentOrganizations ? 'Loading...' : 'Refresh List'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="cooperativeRegType" className="block text-sm font-medium">Registration Type *</label>
                                <select
                                    id="cooperativeRegType"
                                    name="cooperativeRegType"
                                    value={formData.cooperativeRegType}
                                    onChange={handleChange}
                                    disabled={cacLocked}
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                                >
                                    <option value="RC">RC - Registration Certificate</option>
                                    <option value="BN">BN - Business Name</option>
                                    <option value="IT">IT - Incorporated Trustee</option>
                                    <option value="LP">LP - Limited Partnership</option>
                                    <option value="LLP">LLP - Limited Liability Partnership</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="cooperativeRegNo" className="block text-sm font-medium">Organization Registration Number *</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        id="cooperativeRegNo" 
                                        name="cooperativeRegNo" 
                                        value={formData.cooperativeRegNo} 
                                        onChange={handleChange} 
                                        required 
                                        disabled={cacLocked}
                                        placeholder="Enter registration number (e.g., RC00000011, BN123456, etc.)"
                                        className="flex-1 mt-1 p-2 border border-yellow-400 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCACLookup}
                                        disabled={cacLookupLoading || cacLocked || !formData.cooperativeRegNo || formData.cooperativeRegNo.replace(/[^0-9]/g, '').length < 6}
                                        className="mt-1 px-3 py-2 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {cacLookupLoading ? 'Looking...' : 'CAC Lookup'}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">Select registration type, enter your registration number, and click CAC Lookup to auto-fill organization details</p>
                                {cacLookupLoading && <span className="text-xs text-yellow-600">Looking up CAC details...</span>}
                                {cacLookupError && <span className="text-xs text-red-600">{cacLookupError}</span>}
                            </div>
                            <div>
                                <label htmlFor="cooperativeName" className="block text-sm font-medium">Organization Name *</label>
                                <input 
                                    type="text" 
                                    id="cooperativeName" 
                                    name="cooperativeName" 
                                    value={formData.cooperativeName} 
                                    onChange={handleChange} 
                                    required 
                                    readOnly={cacLocked}
                                    className={`w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${cacLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Address *</label>
                                <input 
                                    type="text" 
                                    name="address" 
                                    value={formData.address} 
                                    onChange={handleChange} 
                                    required 
                                    readOnly={cacLocked}
                                    className={`w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${cacLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">City *</label>
                                <input 
                                    type="text" 
                                    name="city" 
                                    value={formData.city} 
                                    onChange={handleChange} 
                                    required 
                                    readOnly={cacLocked}
                                    className={`w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${cacLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">State *</label>
                                    <input 
                                        type="text" 
                                        name="state" 
                                        value={formData.state} 
                                        onChange={handleChange} 
                                        required 
                                        readOnly={cacLocked}
                                        placeholder="Enter state"
                                        className={`w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${cacLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">LGA *</label>
                                    <input 
                                        type="text" 
                                        name="lga" 
                                        value={formData.lga} 
                                        onChange={handleChange} 
                                        required 
                                        readOnly={cacLocked}
                                        placeholder="Enter LGA"
                                        className={`w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${cacLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                     <div>
                        <h3 className="text-xl font-semibold border-b pb-2">Step 2: Financial & Contact Details</h3>
                        <div className="space-y-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium">Bank Name *</label>
                                <select 
                                    name="bankName" 
                                    value={formData.bankName} 
                                    onChange={(e) => {
                                        handleChange(e);
                                        // Clear account name when bank changes
                                        setFormData(prev => ({ ...prev, bankAccountName: '' }));
                                        setAccountResolutionError(null);
                                    }} 
                                    required 
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="">Select Bank</option>
                                    {banks.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Bank Account Number *</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        name="bankAccountNumber" 
                                        value={formData.bankAccountNumber} 
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                            if (value.length <= 10) {
                                                setFormData(prev => ({ ...prev, bankAccountNumber: value }));
                                            }
                                        }}
                                        required 
                                        minLength={10}
                                        maxLength={10}
                                        className="flex-1 mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-black dark:text-black"
                                        placeholder="1234567890"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const selectedBank = banks.find(b => b.name === formData.bankName);
                                            if (selectedBank && formData.bankAccountNumber.length === 10) {
                                                resolveAccountName(selectedBank.code, formData.bankAccountNumber);
                                            }
                                        }}
                                        disabled={resolvingAccount || !formData.bankName || formData.bankAccountNumber.length !== 10}
                                        className="mt-1 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {resolvingAccount ? 'Resolving...' : 'Resolve Name'}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">Must be exactly 10 digits. Click "Resolve Name" to auto-fill account holder name.</p>
                                {accountResolutionError && (
                                    <div className="mt-1">
                                        <p className="text-xs text-red-600">{accountResolutionError}</p>
                                        {accountResolutionError.includes('not supported') && (
                                            <p className="text-xs text-blue-600 mt-1">
                                                💡 Try selecting a major commercial bank like Access Bank, First Bank, GTBank, or Sterling Bank.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Bank Account Name *</label>
                                <input 
                                    type="text" 
                                    name="bankAccountName" 
                                    value={formData.bankAccountName} 
                                    onChange={handleChange} 
                                    required 
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-black dark:text-black"
                                    placeholder={resolvingAccount ? "Resolving account name..." : "Account holder name"}
                                />
                                {resolvingAccount && (
                                    <div className="flex items-center mt-1">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                        <span className="text-xs text-blue-600">Resolving account name...</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Organization Phone *</label>
                                <input 
                                    type="tel" 
                                    name="phone" 
                                    value={formData.phone} 
                                    onChange={(e) => {
                                        if (cacLocked) return;
                                        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                        if (value.length <= 11) {
                                            setFormData(prev => ({ ...prev, phone: value }));
                                        }
                                    }}
                                    required 
                                    minLength={11}
                                    maxLength={11}
                                    readOnly={cacLocked}
                                    className={`w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-black dark:text-black ${cacLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    placeholder="08012345678"
                                />
                                <p className="text-xs text-gray-600 mt-1">Must be exactly 11 digits (e.g., 08012345678)</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Organization Email *</label>
                                <input type="email" name="cooperativeEmail" value={formData.cooperativeEmail} onChange={handleChange} required readOnly={cacLocked} className={`w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-black dark:text-black ${cacLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}/>
                            </div>
                        </div>
                        <div className="flex justify-start pt-4">
                            <button type="button" onClick={() => setCurrentStep(1)} className="text-gray-600 hover:text-gray-900">&larr; Back</button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div>
                        <h3 className="text-xl font-semibold border-b pb-2">Step 3: Leader's Details</h3>
                        <p className="text-sm text-gray-500 mt-2">Create the primary leader account for this organization.</p>
                        <div className="space-y-4 mt-4">
                            {/* NIN Lookup Section */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <label className="block text-sm font-medium text-blue-900">Leader's NIN (Optional - for auto-fill)</label>
                                <div className="flex gap-2 mt-1">
                                    <input 
                                        type="text" 
                                        name="leaderNin" 
                                        value={formData.leaderNin} 
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                            if (value.length <= 11) {
                                                setFormData(prev => ({ ...prev, leaderNin: value }));
                                            }
                                        }}
                                        disabled={leaderNinLocked}
                                        maxLength={11}
                                        className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black dark:text-black disabled:bg-gray-100"
                                        placeholder="Enter 11-digit NIN"
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setLeaderNinLookupError(null);
                                            if (!formData.leaderNin || formData.leaderNin.length !== 11) return;
                                            setLeaderNinLookupLoading(true);
                                            try {
                                                const res = await fetch('/api/identity/nin/lookup', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ nin: formData.leaderNin, provider: 'korapay' }),
                                                });
                                                const data = await res.json();
                                                if (!res.ok) throw new Error(data.message || 'Korapay NIN lookup failed');
                                                
                                                // Populate leader form with NIN data
                                                setFormData(prev => ({
                                                    ...prev,
                                                    leaderFirstName: data.data.firstName || '',
                                                    leaderLastName: data.data.lastName || '',
                                                    leaderEmail: data.data.email || '',
                                                    leaderPhone: data.data.phoneNumber || '',
                                                }));
                                                setLeaderNinPhoto(data.data.photo ? `data:image/jpeg;base64,${data.data.photo}` : '');
                                                setLeaderNinLocked(true);
                                            } catch (err: any) {
                                                setLeaderNinLookupError(err.message);
                                                setLeaderNinLocked(false);
                                            } finally {
                                                setLeaderNinLookupLoading(false);
                                            }
                                        }}
                                        disabled={leaderNinLookupLoading || leaderNinLocked || !formData.leaderNin || formData.leaderNin.length !== 11}
                                        className="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {leaderNinLookupLoading ? 'Looking...' : 'Korapay Lookup'}
                                    </button>
                                </div>
                                <p className="text-xs text-blue-700 mt-1">Enter leader's 11-digit NIN and click lookup to auto-fill details</p>
                                {leaderNinLookupLoading && <span className="text-xs text-blue-600">Looking up NIN...</span>}
                                {leaderNinLookupError && <span className="text-xs text-red-600">{leaderNinLookupError}</span>}
                                {leaderNinLocked && (
                                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                        <p className="text-xs text-green-700">✅ Leader NIN verified and details populated</p>
                                        {leaderNinPhoto && (
                                            <div className="mt-2">
                                                <img 
                                                    src={leaderNinPhoto} 
                                                    alt="Leader NIN Photo" 
                                                    className="w-16 h-16 object-cover rounded border"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Leader's First Name *</label>
                                    <input 
                                        type="text" 
                                        name="leaderFirstName" 
                                        value={formData.leaderFirstName} 
                                        onChange={handleChange} 
                                        required 
                                        disabled={leaderNinLocked}
                                        className="w-full mt-1 p-2 border rounded-md text-black dark:text-black disabled:bg-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Leader's Last Name *</label>
                                    <input 
                                        type="text" 
                                        name="leaderLastName" 
                                        value={formData.leaderLastName} 
                                        onChange={handleChange} 
                                        required 
                                        disabled={leaderNinLocked}
                                        className="w-full mt-1 p-2 border rounded-md text-black dark:text-black disabled:bg-gray-100"
                                    />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Leader's Phone *</label>
                                    <input 
                                        type="tel" 
                                        name="leaderPhone" 
                                        value={formData.leaderPhone} 
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                            if (value.length <= 11) {
                                                setFormData(prev => ({ ...prev, leaderPhone: value }));
                                            }
                                        }}
                                        required 
                                        minLength={11}
                                        maxLength={11}
                                        disabled={leaderNinLocked}
                                        className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-black dark:text-black disabled:bg-gray-100"
                                        placeholder="08012345678"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">Must be exactly 11 digits (e.g., 08012345678)</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Leader's Title *</label>
                                    <input type="text" name="leaderTitle" value={formData.leaderTitle} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md text-black dark:text-black"/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Leader's Email *</label>
                                <input 
                                    type="email" 
                                    name="leaderEmail" 
                                    value={formData.leaderEmail} 
                                    onChange={handleChange} 
                                    required 
                                    disabled={leaderNinLocked}
                                    className="w-full mt-1 p-2 border rounded-md text-black dark:text-black disabled:bg-gray-100"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Leader's Password *</label>
                                <PasswordInput
                                    name="leaderPassword"
                                    value={formData.leaderPassword}
                                    onChange={handleChange}
                                    placeholder="Enter leader's password"
                                    required
                                />
                                <PasswordHints 
                                    password={formData.leaderPassword} 
                                    minLength={8}
                                    showHints={formData.leaderPassword.length > 0}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Leader Bank Name *</label>
                                <select name="leaderBankName" value={formData.leaderBankName} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                                    <option value="">Select Bank</option>
                                    {banks.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Leader Bank Account Number *</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        name="leaderBankAccountNumber" 
                                        value={formData.leaderBankAccountNumber} 
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                            if (value.length <= 10) {
                                                setFormData(prev => ({ ...prev, leaderBankAccountNumber: value }));
                                            }
                                        }}
                                        required 
                                        minLength={10}
                                        maxLength={10}
                                        className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                        placeholder="1234567890"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (formData.leaderBankName && formData.leaderBankAccountNumber) {
                                                const selectedBank = banks.find(b => b.name === formData.leaderBankName);
                                                if (selectedBank) {
                                                    resolveLeaderAccountName(selectedBank.code, formData.leaderBankAccountNumber);
                                                }
                                            }
                                        }}
                                        disabled={resolvingLeaderAccount || !formData.leaderBankName || !formData.leaderBankAccountNumber || formData.leaderBankAccountNumber.length !== 10}
                                        className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {resolvingLeaderAccount ? 'Resolving...' : 'Resolve'}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">Must be exactly 10 digits</p>
                                {leaderAccountResolutionError && <p className="text-xs text-red-600 mt-1">{leaderAccountResolutionError}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Leader Bank Account Name *</label>
                                <input 
                                    type="text" 
                                    name="leaderBankAccountName" 
                                    value={formData.leaderBankAccountName} 
                                    onChange={handleChange}
                                    required 
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    placeholder="Enter account holder's name"
                                />
                                <p className="text-xs text-gray-600 mt-1">Account holder's name as it appears on the bank account</p>
                            </div>
                        </div>
                        <div className="flex justify-start pt-4">
                            <button type="button" onClick={() => setCurrentStep(2)} className="text-gray-600 hover:text-gray-900">&larr; Back</button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };
    
    const renderMemberStepForm = () => {
        switch (memberStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Select Your Cooperative</h3>
                        <div>
                            <label htmlFor="cooperativeCode" className="block text-sm font-medium text-gray-700">
                                Select Cooperative *
                            </label>
                            {loadingCooperatives ? (
                                <div className="w-full mt-1 p-3 border border-gray-300 rounded-md bg-gray-50 flex items-center justify-center">
                                    <span className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></span>
                                    <span className="text-sm text-gray-600">Loading cooperatives...</span>
                                </div>
                            ) : cooperatives.length === 0 ? (
                                <div className="w-full mt-1 p-3 border border-red-300 rounded-md bg-red-50">
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <span className="text-sm text-red-600">No cooperatives available</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={fetchCooperatives}
                                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Try again
                                    </button>
                                </div>
                            ) : (
                                <select
                                    id="cooperativeCode"
                                    name="cooperativeCode"
                                    value={formData.cooperativeCode}
                                    onChange={handleChange}
                                    required
                                    className="w-full mt-1 p-3 border border-yellow-400 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-gray-900"
                                    style={{ 
                                        WebkitAppearance: 'none',
                                        MozAppearance: 'none',
                                        appearance: 'none',
                                        backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center',
                                        backgroundSize: '16px',
                                        paddingRight: '40px'
                                    }}
                                >
                                    <option value="">Select your cooperative</option>
                                    {cooperatives.map((coop) => (
                                        <option key={coop.code} value={coop.code}>
                                            {coop.name} ({coop.code})
                                        </option>
                                    ))}
                                </select>
                            )}
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-600">
                                    Choose your cooperative from the list. If the list is empty, try refreshing.
                                </p>
                                <button 
                                    type="button"
                                    onClick={fetchCooperatives}
                                    disabled={loadingCooperatives}
                                    className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                                >
                                    {loadingCooperatives ? 'Loading...' : 'Refresh List'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 2: {
                const selectedState = states.find(s => s.name === formData.state);
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Personal Details</h3>
                        
                        {/* NIN Field with Korapay and Mono Lookup */}
                        <div>
                            <label htmlFor="nin" className="block text-sm font-medium">NIN (National Identification Number) *</label>
                            <div className="flex gap-2">
                            <input
                                type="text"
                                id="nin"
                                name="nin"
                                value={formData.nin}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                        if (value.length <= 11) {
                                        setFormData(prev => ({ ...prev, nin: value }));
                                    }
                                }}
                                required
                                    maxLength={11}
                                    minLength={11}
                                    className="flex-1 mt-1 p-2 border border-yellow-400 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                                disabled={ninLocked}
                                    placeholder="12345678901"
                            />
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setNinLookupError(null);
                                        if (!formData.nin || formData.nin.length !== 11) return;
                                        setNinLookupLoading(true);
                                        try {
                                            const res = await fetch('/api/identity/nin/mono-lookup', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ nin: formData.nin }),
                                            });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.message || 'Mono NIN lookup failed');
                                            
                                            // Populate form with NIN data
                                            setFormData(prev => ({
                                                ...prev,
                                                firstName: data.data.firstName || '',
                                                lastName: data.data.lastName || '',
                                                dateOfBirth: data.data.dateOfBirth || '',
                                                phoneNumber: data.data.phoneNumber || '',
                                                email: data.data.email || '',
                                                address: data.data.address || '',
                                                city: data.data.city || '',
                                                state: data.data.state || '',
                                                lga: data.data.lga || '',
                                            }));
                                            setNinPhoto(data.data.photo ? `data:image/jpeg;base64,${data.data.photo}` : '');
                                            setNinLocked(true);
                                        } catch (err: any) {
                                            setNinLookupError(err.message);
                                            setNinLocked(false);
                                        } finally {
                                            setNinLookupLoading(false);
                                        }
                                    }}
                                    disabled={ninLookupLoading || ninLocked || !formData.nin || formData.nin.length !== 11}
                                    className="mt-1 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {ninLookupLoading ? 'Looking...' : 'Mono Lookup'}
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setNinLookupError(null);
                                        if (!formData.nin || formData.nin.length !== 11) return;
                                        setNinLookupLoading(true);
                                        try {
                                            const res = await fetch('/api/identity/nin/lookup', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ nin: formData.nin, provider: 'korapay' }),
                                            });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.message || 'Korapay NIN lookup failed');
                                            
                                            // Populate form with NIN data
                                            setFormData(prev => ({
                                                ...prev,
                                                firstName: data.data.firstName || '',
                                                lastName: data.data.lastName || '',
                                                dateOfBirth: data.data.dateOfBirth || '',
                                                phoneNumber: data.data.phoneNumber || '',
                                                email: data.data.email || '',
                                                address: data.data.address || '',
                                                city: data.data.city || '',
                                                state: data.data.state || '',
                                                lga: data.data.lga || '',
                                            }));
                                            setNinPhoto(data.data.photo ? `data:image/jpeg;base64,${data.data.photo}` : '');
                                            setNinLocked(true);
                                        } catch (err: any) {
                                            setNinLookupError(err.message);
                                            setNinLocked(false);
                                        } finally {
                                            setNinLookupLoading(false);
                                        }
                                    }}
                                    disabled={ninLookupLoading || ninLocked || !formData.nin || formData.nin.length !== 11}
                                    className="mt-1 px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {ninLookupLoading ? 'Looking...' : 'Korapay Lookup'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Enter your 11-digit NIN and click a lookup button to auto-fill your details</p>
                            {ninLookupLoading && <span className="text-xs text-blue-600">Looking up NIN...</span>}
                            {ninLookupError && <span className="text-xs text-red-600">{ninLookupError}</span>}
                            {ninLocked && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                    <p className="text-xs text-green-700">✅ NIN verified and details populated</p>
                                </div>
                            )}
                        </div>

                        {/* NIN Photo Display */}
                        {ninLocked && ninPhoto && (
                            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">NIN Verification Photo</h4>
                                <div className="flex items-center space-x-4">
                                    <img 
                                        src={ninPhoto} 
                                        alt="NIN Verification Photo" 
                                        className="w-20 h-20 object-cover rounded border"
                                        onError={(e) => {
                                            console.error('Failed to load NIN photo:', e);
                                            e.currentTarget.style.display = 'none';
                                        }}
                                        onLoad={() => {
                                            console.log('NIN photo loaded successfully');
                                        }}
                                    />
                                    <div className="text-xs text-gray-600">
                                        <p>✅ Photo verified from NIN database</p>
                                        <p className="text-gray-500 mt-1">This photo will be saved with your registration</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">First Name</label>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className={`w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${ninLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`} readOnly={ninLocked} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Last Name</label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className={`w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${ninLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`} readOnly={ninLocked} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium">Email Address *</label>
                            <input 
                                type="email" 
                                id="email"
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                required 
                                readOnly={ninLocked && formData.email !== ''}
                                className={`w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${ninLocked && formData.email !== '' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            />
                            <p className="text-xs text-gray-600 mt-1">This will be used for login and notifications</p>
                        </div>
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium">Phone Number *</label>
                                <input 
                                    type="tel" 
                                    id="phoneNumber"
                                    name="phoneNumber" 
                                    value={formData.phoneNumber} 
                                    onChange={(e) => {
                                        if (ninLocked) return;
                                        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                        if (value.length <= 11) {
                                            setFormData(prev => ({ ...prev, phoneNumber: value }));
                                        }
                                    }}
                                    required 
                                    minLength={11}
                                    maxLength={11}
                                    readOnly={ninLocked}
                                    className={`w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-black dark:text-black ${ninLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    placeholder="08012345678"
                                />
                            <p className="text-xs text-gray-600 mt-1">Must be exactly 11 digits (e.g., 08012345678)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Password *</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    required 
                                    minLength={6}
                                    className="w-full mt-1 p-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-black dark:text-black" 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <PasswordHints 
                                password={formData.password} 
                                minLength={8}
                                showHints={formData.password.length > 0}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Confirm Password *</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    name="confirmPassword" 
                                    value={formData.confirmPassword} 
                                    onChange={handleChange} 
                                    required 
                                    minLength={6}
                                    className="w-full mt-1 p-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-black dark:text-black" 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <div className="mt-2">
                                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                    <p className="text-sm text-red-600">Passwords do not match</p>
                                )}
                                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                    <p className="text-sm text-green-600">✓ Passwords match</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Date of Birth</label>
                            <input 
                                type="date" 
                                name="dateOfBirth" 
                                value={formData.dateOfBirth || ''} 
                                onChange={handleChange} 
                                required 
                                max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
                                readOnly={ninLocked}
                                className={`w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${ninLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            />
                            <p className="text-xs text-gray-600 mt-1">Minimum age: 16 years</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Occupation *</label>
                            {loadingOccupations ? (
                                <div className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-gray-50 flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
                                    <span className="text-sm text-gray-600">Loading occupations...</span>
                                </div>
                            ) : occupations.length === 0 ? (
                                <div className="w-full mt-1 p-2 border border-red-300 rounded-md bg-red-50 flex items-center">
                                    <svg className="h-4 w-4 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <span className="text-sm text-red-600">No occupations available</span>
                                </div>
                            ) : (
                                <select 
                                    name="occupation" 
                                    value={formData.occupation} 
                                    onChange={handleChange} 
                                    required 
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-black dark:text-black"
                                >
                                    <option value="">Select your occupation</option>
                                    {occupations.map(occupation => (
                                        <option key={occupation.id} value={occupation.name}>
                                            {occupation.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <p className="text-xs text-gray-600 mt-1">Select your current occupation</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Address</label>
                            <input type="text" name="address" value={formData.address} onChange={handleChange} required readOnly={ninLocked} className={`w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-black dark:text-black ${ninLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">City</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} required readOnly={ninLocked} className={`w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-black dark:text-black ${ninLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">State</label>
                                <select name="state" value={formData.state} onChange={handleChange} required disabled={ninLocked} className={`w-full mt-1 p-2 border border-yellow-400 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 text-black dark:text-black ${ninLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                                    <option value="">Select State</option>
                                    {states.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">LGA</label>
                                <select name="lga" value={formData.lga} onChange={handleChange} required disabled={!formData.state || ninLocked} className={`w-full mt-1 p-2 border border-yellow-400 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 text-black dark:text-black ${ninLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                                    <option value="">Select LGA</option>
                                    {selectedState && selectedState.lgas.map(lga => <option key={lga} value={lga}>{lga}</option>)}
                                </select>
                            </div>
                            <div></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Next of Kin Full Name *</label>
                                <input 
                                    type="text" 
                                    name="nextOfKinName" 
                                    value={formData.nextOfKinName} 
                                    onChange={handleChange} 
                                    required 
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-black dark:text-black" 
                                    placeholder="Full name as it appears on NIN"
                                />
                                <p className="text-xs text-gray-600 mt-1">Full name as it appears on NIN</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Next of Kin Phone Number *</label>
                                <input 
                                    type="tel" 
                                    name="nextOfKinPhone" 
                                    value={formData.nextOfKinPhone} 
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                        if (value.length <= 11) {
                                            setFormData(prev => ({ ...prev, nextOfKinPhone: value }));
                                        }
                                    }}
                                    required 
                                    minLength={11}
                                    maxLength={11}
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-black dark:text-black" 
                                    placeholder="08012345678"
                                />
                                <p className="text-xs text-gray-600 mt-1">Must be exactly 11 digits (e.g., 08012345678)</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Emergency Contact Name *</label>
                                <input 
                                    type="text" 
                                    name="emergencyContact" 
                                    value={formData.emergencyContact} 
                                    onChange={handleChange} 
                                    required 
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-black dark:text-black" 
                                />
                                <p className="text-xs text-gray-600 mt-1">Name of emergency contact person</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Emergency Contact Phone *</label>
                                <input 
                                    type="tel" 
                                    name="emergencyPhone" 
                                    value={formData.emergencyPhone} 
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                        if (value.length <= 11) {
                                            setFormData(prev => ({ ...prev, emergencyPhone: value }));
                                        }
                                    }}
                                    required 
                                    minLength={11}
                                    maxLength={11}
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-black dark:text-black" 
                                    placeholder="08012345678"
                                />
                                <p className="text-xs text-gray-600 mt-1">Must be exactly 11 digits (e.g., 08012345678)</p>
                            </div>
                        </div>
                        <div className="flex justify-start pt-4">
                            <button type="button" onClick={() => setMemberStep(1)} className="text-gray-600 hover:text-gray-900">&larr; Back</button>
                        </div>
                    </div>
                );
            }
            case 3:
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Saving Preferences</h3>
                        
                        <div>
                            <label className="block text-sm font-medium">Saving Amount *</label>
                            <input
                                type="number"
                                name="savingAmount"
                                value={formData.savingAmount}
                                onChange={handleChange}
                                required
                                min="100"
                                placeholder="Enter amount you want to save"
                                className="w-full mt-1 p-2 border border-yellow-400 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                            />
                            <p className="text-xs text-gray-600 mt-1">Minimum amount: ₦100</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Saving Frequency *</label>
                            <select
                                name="savingFrequency"
                                value={formData.savingFrequency}
                                onChange={handleChange}
                                required
                                className="w-full mt-1 p-2 border border-yellow-400 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                            >
                                <option value="">Select frequency</option>
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                                <option value="MONTHLY">Monthly</option>
                            </select>
                            <p className="text-xs text-gray-600 mt-1">Choose how often you want to save</p>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Your Saving Plan</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                {formData.savingAmount && formData.savingFrequency ? (
                                    `You will save ₦${formData.savingAmount} ${formData.savingFrequency.toLowerCase()}`
                                ) : (
                                    'Complete the fields above to see your saving plan'
                                )}
                            </p>
                        </div>

                        <div className="flex justify-start pt-4">
                            <button type="button" onClick={() => setMemberStep(2)} className="text-gray-600 hover:text-gray-900">&larr; Back</button>
                            <button type="submit" disabled={isLoading} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center min-w-[120px]">
                                {isLoading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span> : null}
                                {isLoading ? 'Processing...' : 'Register'}
                            </button>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Emergency Contact</label>
                            <input type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Emergency Phone</label>
                            <input type="text" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Saving Amount (₦, minimum 5000)</label>
                            <input type="number" name="savingAmount" value={formData.savingAmount} onChange={handleChange} min={5000} required className="w-full mt-1 p-2 border border-yellow-400 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Saving Frequency</label>
                            <select name="savingFrequency" value={formData.savingFrequency} onChange={handleChange} required className="w-full mt-1 p-2 border border-yellow-400 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500">
                                <option value="">Select Frequency</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Email (Optional)</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                            <p className="text-xs text-gray-600 mt-1">Email is optional. You can use your phone number or NIN to login instead.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Password</label>
                            <PasswordInput
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Confirm Password</label>
                            <PasswordInput
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                required
                            />
                        </div>
                        <div className="flex justify-start pt-4">
                            <button type="button" onClick={() => setMemberStep(3)} className="text-gray-600 hover:text-gray-900">&larr; Back</button>
                            <button type="submit" disabled={isLoading} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center min-w-[120px]">
                                {isLoading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span> : null}
                                {isLoading ? 'Processing...' : 'Register'}
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const renderMemberForm = () => (
        <>
            {/* Registration Fee Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Registration Fee</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">One-time registration fee for member registration</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{registrationFee}</p>
                        <p className="text-xs text-blue-500">Payable via Paystack</p>
                    </div>
                </div>
            </div>
            
            <h3 className="text-xl font-semibold border-b pb-2">Member Registration</h3>
            {renderMemberStepForm()}
        </>
    );

    const renderForm = () => {
        if (!registrationType) {
            return (
                <div className="text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Choose Registration Type</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div onClick={() => handleTypeSelect('COOPERATIVE')} className="p-4 sm:p-8 border rounded-lg bg-white shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                            <h3 className="text-lg sm:text-xl font-semibold text-green-600">Register an Organization</h3>
                            <p className="text-sm sm:text-base text-gray-600 mt-2">Create a new organization and the primary leader account.</p>
                        </div>
                        <div onClick={() => handleTypeSelect('MEMBER')} className="p-4 sm:p-8 border rounded-lg bg-white shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                            <h3 className="text-lg sm:text-xl font-semibold text-yellow-600">Register as a Member</h3>
                            <p className="text-sm sm:text-base text-gray-600 mt-2">Join an existing organization as a member.</p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <form onSubmit={handleSubmit}>
                {error && <p className="text-red-700 bg-red-100 border border-red-200 p-3 rounded mb-4 font-semibold text-center">{error}</p>}
                {success && <p className="text-green-700 bg-green-100 border border-green-200 p-3 rounded mb-4 font-semibold text-center">{success}</p>}

                {registrationType === 'COOPERATIVE' ? renderCooperativeForm() : renderMemberForm()}

                {/* Terms & Conditions agreement */}
                <div className="mt-6 border-t pt-4">
                    <div className="flex items-start gap-3">
                        <input id="accept-terms" type="checkbox" checked={acceptedTerms} onChange={(e)=>setAcceptedTerms(e.target.checked)} className="mt-1" />
                        <label htmlFor="accept-terms" className="text-sm text-gray-700">I have read and agree to the <button type="button" className="text-blue-600 underline" onClick={()=>setShowTerms(true)}>Terms & Conditions</button>.</label>
                    </div>
                </div>

                <div className="flex justify-end pt-6">
                    <button type="submit" disabled={isLoading} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center min-w-[120px]">
                        {isLoading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span> : null}
                        {isLoading ? 'Processing...' : (
                            (registrationType === 'COOPERATIVE' && currentStep < 3) || 
                            (registrationType === 'MEMBER' && memberStep < 3) 
                            ? 'Next' : 'Register'
                        )}
                    </button>
                </div>
            </form>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center py-4 sm:py-12 relative">
            <Link href="/" className="absolute left-2 sm:left-8 top-2 sm:top-8">
                <button className="px-2 sm:px-4 py-1 sm:py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 font-semibold transition shadow text-sm">
                    <span className="hidden sm:inline">&larr; Back to Home</span>
                    <span className="sm:hidden">&larr; Back</span>
                </button>
            </Link>
            <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
                <div className="flex flex-col items-center mb-4">
                    <Image src="/logo.png" alt="Nogalss Logo" width={64} height={64} className="sm:w-24 sm:h-24" priority />
                </div>
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="mt-2 sm:mt-4 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Create an Account</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-8">
                    {renderForm()}
                </div>
            </div>

            {/* Terms & Conditions Modal */}
            {showTerms && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white dark:bg-gray-900 max-w-3xl w-full rounded-lg shadow-lg p-6 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Terms & Conditions</h3>
                            <button onClick={()=>setShowTerms(false)} className="text-gray-600 hover:text-gray-900">✕</button>
                        </div>
                        <div className="prose prose-sm dark:prose-invert">
                            <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
                            <p>These Terms & Conditions (the “Terms”) govern your access to and use of the Nogalss Cooperative platform and services (“Services”). By registering or using the Services, you agree to these Terms.</p>
                            <h4>1. Eligibility and Account</h4>
                            <ul>
                                <li>You must provide accurate, complete information (including NIN/CAC where required).</li>
                                <li>If you register an organization, you confirm you’re authorized to do so.</li>
                            </ul>
                            <h4>2. Verification</h4>
                            <p>You consent to identity and corporate verification via approved providers (e.g., Korapay/Mono) and to provide additional documents where required.</p>
                            <h4>3. Fees and Payments</h4>
                            <p>Fees are shown before payment and processed by third-party providers (e.g., Paystack). Fees are generally non-refundable once services are provisioned, except as required by law.</p>
                            <h4>4. Wallets & Allocations</h4>
                            <p>Virtual accounts/wallets may be created for operations. Super Admin allocations are handled per configured settings. Withdrawals may require verification and are processed by payment providers.</p>
                            <h4>5. Communications</h4>
                            <p>We may send service emails/SMS (e.g., confirmations, alerts). Carrier/data charges may apply.</p>
                            <h4>6. Acceptable Use</h4>
                            <p>No unlawful use, fraud, IP infringement, privacy breaches, or interference with the Services.</p>
                            <h4>7. Privacy</h4>
                            <p>Personal data is processed per our Privacy Policy and applicable law.</p>
                            <h4>8. Availability & Changes</h4>
                            <p>We strive for availability but do not guarantee uninterrupted service. We may modify or discontinue features.</p>
                            <h4>9. IP</h4>
                            <p>All platform IP remains with Nogalss/licensors. You receive a limited license to use the Services.</p>
                            <h4>10. Suspension/Termination</h4>
                            <p>We may suspend/terminate for violations, suspected fraud, or legal requirements.</p>
                            <h4>11. Disclaimers</h4>
                            <p>Services are provided “as is,” without warranties of any kind to the fullest extent permitted by law.</p>
                            <h4>12. Limitation of Liability</h4>
                            <p>To the maximum extent permitted by law, Nogalss shall not be liable for indirect or consequential damages. Aggregate liability is limited to fees paid in the prior 3 months for the relevant Service.</p>
                            <h4>13. Indemnity</h4>
                            <p>You agree to indemnify Nogalss for claims arising from your use or breach of these Terms.</p>
                            <h4>14. Governing Law & Disputes</h4>
                            <p>These Terms are governed by Nigerian law. Disputes will be resolved by good-faith negotiation, then binding arbitration in Nigeria where permitted by law.</p>
                            <h4>15. Changes</h4>
                            <p>We may update these Terms. Continued use after changes take effect indicates acceptance.</p>
                            <h4>16. Contact</h4>
                            <p>support@nogalssapexcoop.org</p>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={()=>setShowTerms(false)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}