'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { banks, states } from '@/lib/data';
import Image from 'next/image';
import PasswordInput from '@/components/ui/PasswordInput';

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
        leaderBankName: '',
        leaderBankAccountNumber: '',
        bankAccountName: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [ninLookupLoading, setNinLookupLoading] = useState(false);
    const [ninLookupError, setNinLookupError] = useState<string | null>(null);
    const [registrationFee, setRegistrationFee] = useState<string>('₦500.00');
    const [ninLocked, setNinLocked] = useState(false);
    const [cooperatives, setCooperatives] = useState<{ code: string; name: string }[]>([]);
    const [loadingCooperatives, setLoadingCooperatives] = useState(false);
    const [occupations, setOccupations] = useState<{ id: string; name: string }[]>([]);
    const [loadingOccupations, setLoadingOccupations] = useState(false);
    const [memberStep, setMemberStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);


    useEffect(() => {
        fetchRegistrationFee();
        fetchOccupations(); // Always fetch occupations
        if (registrationType === 'MEMBER') {
            fetchCooperatives();
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
            const response = await fetch('/api/public/registration-fee');
            const data = await response.json();
            if (response.ok) {
                setRegistrationFee(data.registrationFeeFormatted);
            }
        } catch (err) {
            console.error('Failed to fetch registration fee:', err);
            setRegistrationFee('₦5,000.00'); // Fallback
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

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, registrationType }),
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
                                <label htmlFor="cooperativeName" className="block text-sm font-medium">Organization Name *</label>
                                <input type="text" id="cooperativeName" name="cooperativeName" value={formData.cooperativeName} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/>
                            </div>
                            <div>
                                <label htmlFor="cooperativeRegNo" className="block text-sm font-medium">Organization Registration Number *</label>
                                <input type="text" id="cooperativeRegNo" name="cooperativeRegNo" value={formData.cooperativeRegNo} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Address *</label>
                                <input type="text" name="address" value={formData.address} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">City *</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">State *</label>
                                    <select name="state" value={formData.state} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md">
                                        <option value="">Select State</option>
                                        {states.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">LGA *</label>
                                     <select name="lga" value={formData.lga} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md" disabled={!formData.state}>
                                        <option value="">Select LGA</option>
                                        {selectedState && selectedState.lgas.map(lga => <option key={lga} value={lga}>{lga}</option>)}
                                    </select>
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
                                <select name="bankName" value={formData.bankName} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md">
                                    <option value="">Select Bank</option>
                                    {banks.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Bank Account Number *</label>
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
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    placeholder="1234567890"
                                />
                                <p className="text-xs text-gray-600 mt-1">Must be exactly 10 digits</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Bank Account Name *</label>
                                <input type="text" name="bankAccountName" value={formData.bankAccountName} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Organization Phone *</label>
                                <input 
                                    type="tel" 
                                    name="phone" 
                                    value={formData.phone} 
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                        if (value.length <= 11) {
                                            setFormData(prev => ({ ...prev, phone: value }));
                                        }
                                    }}
                                    required 
                                    minLength={11}
                                    maxLength={11}
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    placeholder="08012345678"
                                />
                                <p className="text-xs text-gray-600 mt-1">Must be exactly 11 digits (e.g., 08012345678)</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Organization Email *</label>
                                <input type="email" name="cooperativeEmail" value={formData.cooperativeEmail} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div>
                        <h3 className="text-xl font-semibold border-b pb-2">Step 3: Leader's Details</h3>
                        <p className="text-sm text-gray-500 mt-2">Create the primary leader account for this organization.</p>
                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Leader's First Name *</label>
                                    <input type="text" name="leaderFirstName" value={formData.leaderFirstName} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Leader's Last Name *</label>
                                    <input type="text" name="leaderLastName" value={formData.leaderLastName} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/>
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
                                        className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                        placeholder="08012345678"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">Must be exactly 11 digits (e.g., 08012345678)</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Leader's Title *</label>
                                    <input type="text" name="leaderTitle" value={formData.leaderTitle} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Leader's Email *</label>
                                <input type="email" name="leaderEmail" value={formData.leaderEmail} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/>
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
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    placeholder="1234567890"
                                />
                                <p className="text-xs text-gray-600 mt-1">Must be exactly 10 digits</p>
                            </div>
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
                        
                        {/* NIN Field */}
                        <div>
                            <label htmlFor="nin" className="block text-sm font-medium">NIN *</label>
                            <input
                                type="text"
                                id="nin"
                                name="nin"
                                value={formData.nin}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                    if (value.length <= 10) {
                                        setFormData(prev => ({ ...prev, nin: value }));
                                    }
                                }}
                                onBlur={handleNinBlur}
                                required
                                maxLength={10}
                                minLength={10}
                                className="w-full mt-1 p-2 border border-yellow-400 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                                disabled={ninLocked}
                                placeholder="1234567890"
                            />
                            {ninLookupLoading && <span className="text-xs text-yellow-600">Looking up NIN...</span>}
                            {ninLookupError && <span className="text-xs text-red-600">{ninLookupError}</span>}
                            {!ninLocked && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setNinLookupError(null);
                                        if (!formData.nin || formData.nin.length !== 11) return;
                                        setNinLookupLoading(true);
                                        try {
                                            const res = await fetch('/api/lookup/nin', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ nin: formData.nin }),
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
                                        } catch (err) {
                                            setNinLookupError(err.message);
                                            setNinLocked(false);
                                        } finally {
                                            setNinLookupLoading(false);
                                        }
                                    }}
                                    disabled={ninLookupLoading || ninLocked || !formData.nin || formData.nin.length !== 10}
                                    className="mt-2 px-4 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
                                >
                                    {ninLookupLoading ? 'Looking up...' : 'Look Up NIN'}
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">First Name</label>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" disabled={ninLocked} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Last Name</label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" disabled={ninLocked} />
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
                                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" 
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
                                    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                    if (value.length <= 11) {
                                        setFormData(prev => ({ ...prev, phoneNumber: value }));
                                    }
                                }}
                                required 
                                minLength={11}
                                maxLength={11}
                                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" 
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
                                    className="w-full mt-1 p-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" 
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
                            <p className="text-xs text-gray-600 mt-1">Minimum 6 characters</p>
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
                                    className="w-full mt-1 p-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" 
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
                            <p className="text-xs text-gray-600 mt-1">Re-enter your password to confirm</p>
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
                                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" 
                                disabled={ninLocked} 
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
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
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
                            <input type="text" name="address" value={formData.address} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">City</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">State</label>
                                <select name="state" value={formData.state} onChange={handleChange} required className="w-full mt-1 p-2 border border-yellow-400 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500">
                                    <option value="">Select State</option>
                                    {states.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">LGA</label>
                                <select name="lga" value={formData.lga} onChange={handleChange} required className="w-full mt-1 p-2 border border-yellow-400 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500" disabled={!formData.state}>
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
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" 
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
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" 
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
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" 
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
                                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" 
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

                        <div className="flex justify-between pt-4">
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
                            <label className="block text-sm font-medium">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
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
                        <div className="flex justify-between pt-4">
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
        </div>
    );
}