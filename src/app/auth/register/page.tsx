'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { banks, states } from '@/lib/data';
import Image from 'next/image';

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
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [ninLookupLoading, setNinLookupLoading] = useState(false);
    const [ninLookupError, setNinLookupError] = useState<string | null>(null);
    const [ninLocked, setNinLocked] = useState(false);
    const [cooperatives, setCooperatives] = useState<{ code: string; name: string }[]>([]);
    const [memberStep, setMemberStep] = useState(1);

    useEffect(() => {
        if (registrationType === 'MEMBER') {
            fetch('/api/cooperatives/list')
                .then(res => res.json())
                .then(data => setCooperatives(data))
                .catch(() => setCooperatives([]));
        }
    }, [registrationType]);

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
            
            // If member, create virtual account
            if (registrationType === 'MEMBER') {
                try {
                    const vaRes = await fetch('/api/paystack/virtual-account', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: formData.email,
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            phone: formData.emergencyPhone || formData.phone || '',
                            reference: data.userId || data.id || formData.email, // fallback if no userId returned
                        }),
                    });
                    const vaData = await vaRes.json();
                    if (vaRes.ok) {
                        localStorage.setItem('virtualAccountInfo', JSON.stringify(vaData));
                    }
                } catch (err) {
                    // Optionally handle virtual account creation error
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
                        <h3 className="text-xl font-semibold border-b pb-2">Step 1: Co-operative Details</h3>
                        <div className="space-y-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium">Co-operative Name *</label>
                                <input type="text" name="cooperativeName" value={formData.cooperativeName} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Co-operative Registration Number *</label>
                                <input type="text" name="cooperativeRegNo" value={formData.cooperativeRegNo} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Address *</label>
                                <input type="text" name="address" value={formData.address} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">City *</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
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
                            <div>
                                <label className="block text-sm font-medium">Co-operative Phone *</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                            </div>
                                <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Co-operative Phone *</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Co-operative Email *</label>
                                <input type="email" name="cooperativeEmail" value={formData.cooperativeEmail} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div>
                        <h3 className="text-xl font-semibold border-b pb-2">Step 3: Leader's Details</h3>
                        <p className="text-sm text-gray-500 mt-2">Create the primary leader account for this co-operative.</p>
                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Leader's First Name *</label>
                                    <input type="text" name="leaderFirstName" value={formData.leaderFirstName} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Leader's Last Name *</label>
                                    <input type="text" name="leaderLastName" value={formData.leaderLastName} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/>
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Leader's Phone *</label>
                                    <input type="text" name="leaderPhone" value={formData.leaderPhone} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/>
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
                                <input type="password" name="leaderPassword" value={formData.leaderPassword} onChange={handleChange} required className="w-full mt-1 p-2 border rounded-md"/>
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
                            <div>
                                <label className="block text-sm font-medium">Co-operative Phone *</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                            </div>
                                <input type="text" name="leaderBankAccountNumber" value={formData.leaderBankAccountNumber} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"/>
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
                        <div>
                            <label className="block text-sm font-medium">NIN *</label>
                            <input
                                type="text"
                                name="nin"
                                value={formData.nin}
                                onChange={handleChange}
                                onBlur={handleNinBlur}
                                required
                                maxLength={11}
                                minLength={11}
                                className="w-full mt-1 p-2 border border-yellow-400 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                                disabled={ninLocked}
                            />
                            {ninLookupLoading && <span className="text-xs text-yellow-600">Looking up NIN...</span>}
                            {ninLookupError && <span className="text-xs text-red-600">{ninLookupError}</span>}
                        </div>
                        <div className="flex justify-end pt-4 space-x-2">
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
                                    disabled={ninLookupLoading || ninLocked || !formData.nin || formData.nin.length !== 11}
                                    className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
                                >
                                    {ninLookupLoading ? 'Looking up...' : 'Look Up'}
                                </button>
                            )}
                            {ninLocked && (
                                <button
                                    type="button"
                                    onClick={() => setMemberStep(2)}
                                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                    </div>
                );
            case 2: {
                const selectedState = states.find(s => s.name === formData.state);
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
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
                            <label className="block text-sm font-medium">Date of Birth</label>
                            <input type="text" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" disabled={ninLocked} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Occupation</label>
                            <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Address</label>
                            <input type="text" name="address" value={formData.address} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">LGA</label>
                                <select name="lga" value={formData.lga} onChange={handleChange} required className="w-full mt-1 p-2 border border-yellow-400 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500" disabled={!formData.state}>
                                    <option value="">Select LGA</option>
                                    {selectedState && selectedState.lgas.map(lga => <option key={lga} value={lga}>{lga}</option>)}
                                </select>
                            </div>
                            <div></div>
                        </div>
                        <div className="flex justify-between pt-4">
                            <button type="button" onClick={() => setMemberStep(1)} className="text-gray-600 hover:text-gray-900">&larr; Back</button>
                            <button type="button" onClick={() => setMemberStep(3)} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Next</button>
                        </div>
                    </div>
                );
            }
            case 3:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Co-operative</label>
                            <select
                                name="cooperativeCode"
                                value={formData.cooperativeCode}
                                onChange={e => {
                                    setFormData({
                                        ...formData,
                                        cooperativeCode: e.target.value,
                                        cooperativeName: cooperatives.find(c => c.code === e.target.value)?.name || '',
                                    });
                                }}
                                required
                                className="w-full mt-1 p-2 border border-yellow-400 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                            >
                                <option value="">Select a Co-operative</option>
                                {cooperatives.map(c => (
                                    <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-between pt-4">
                            <button type="button" onClick={() => setMemberStep(2)} className="text-gray-600 hover:text-gray-900">&larr; Back</button>
                            <button type="button" onClick={() => setMemberStep(4)} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Next</button>
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
                            <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Confirm Password</label>
                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" />
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
            <h3 className="text-xl font-semibold border-b pb-2">Member Registration</h3>
            {renderMemberStepForm()}
        </>
    );

    const renderForm = () => {
        if (!registrationType) {
            return (
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Registration Type</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div onClick={() => handleTypeSelect('COOPERATIVE')} className="p-8 border rounded-lg bg-white shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                            <h3 className="text-xl font-semibold text-green-600">Register a Co-operative</h3>
                            <p className="text-gray-600 mt-2">Create a new co-operative and the primary leader account.</p>
                        </div>
                        <div onClick={() => handleTypeSelect('MEMBER')} className="p-8 border rounded-lg bg-white shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                            <h3 className="text-xl font-semibold text-yellow-600">Register as a Member</h3>
                            <p className="text-gray-600 mt-2">Join an existing co-operative as a member.</p>
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

                <div className="flex items-center justify-between pt-6">
                    <button type="button" onClick={() => registrationType === 'COOPERATIVE' && currentStep > 1 ? prevStep() : setRegistrationType(null)} className="text-gray-600 hover:text-gray-900">
                        &larr; Back
                    </button>
                    <button type="submit" disabled={isLoading} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center min-w-[120px]">
                        {isLoading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span> : null}
                        {isLoading ? 'Processing...' : (registrationType === 'COOPERATIVE' && currentStep < 3 ? 'Next' : 'Register')}
                    </button>
                </div>
            </form>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 relative">
            <Link href="/" className="absolute left-8 top-8">
                <button className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 font-semibold transition shadow">
                    &larr; Back to Home
                </button>
            </Link>
            <div className="w-full max-w-2xl mx-auto">
                <div className="flex flex-col items-center mb-4">
                    <Image src="/logo.png" alt="Nogalss Logo" width={96} height={96} priority />
                </div>
                <div className="text-center mb-8">
                    <h2 className="mt-4 text-3xl font-bold text-gray-900">Create an Account</h2>
                </div>
                <div className="bg-white rounded-lg shadow-xl p-8">
                    {renderForm()}
                </div>
            </div>
        </div>
    );
}