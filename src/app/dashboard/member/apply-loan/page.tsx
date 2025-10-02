'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function MemberApplyLoanPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loanAmount, setLoanAmount] = useState('');
    const [purpose, setPurpose] = useState('');
    const [repaymentPeriod, setRepaymentPeriod] = useState('6');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [eligibility, setEligibility] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEligibility = async () => {
            try {
                const response = await fetch('/api/member/loan-eligibility');
                const data = await response.json();
                setEligibility(data);
            } catch (error) {
                console.error('Error fetching loan eligibility:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEligibility();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!loanAmount || parseFloat(loanAmount) <= 0) {
            alert('Please enter a valid loan amount');
            return;
        }

        if (!purpose.trim()) {
            alert('Please provide the purpose of the loan');
            return;
        }

        if (eligibility && parseFloat(loanAmount) > eligibility.maxLoanAmount) {
            alert(`Maximum loan amount allowed: ₦${eligibility.maxLoanAmount.toLocaleString()}`);
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/member/apply-loan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: parseFloat(loanAmount),
                    purpose: purpose.trim(),
                    repaymentPeriod: parseInt(repaymentPeriod)
                }),
            });

            const data = await response.json();

            if (data.success) {
                alert('Loan application submitted successfully! You will be notified when it is reviewed.');
                router.push('/dashboard/member');
            } else {
                alert(data.error || 'Failed to submit loan application');
            }
        } catch (error) {
            console.error('Error submitting loan application:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Apply for Loan</h1>
                        <p className="text-gray-600">Submit a loan application to your cooperative</p>
                    </div>

                    {/* Eligibility Status */}
                    {eligibility && (
                        <div className={`border rounded-lg p-4 mb-6 ${
                            eligibility.isEligible 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <div className="flex items-center">
                                <div className={`w-4 h-4 rounded-full mr-3 ${
                                    eligibility.isEligible ? 'bg-green-500' : 'bg-red-500'
                                }`}></div>
                                <div>
                                    <h3 className={`font-medium ${
                                        eligibility.isEligible ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                        {eligibility.isEligible ? 'Eligible for Loan' : 'Not Eligible for Loan'}
                                    </h3>
                                    <p className={`text-sm ${
                                        eligibility.isEligible ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                        {eligibility.isEligible 
                                            ? `Maximum loan amount: ₦${eligibility.maxLoanAmount.toLocaleString()}`
                                            : eligibility.reason
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Loan Amount */}
                        <div>
                            <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 mb-2">
                                Loan Amount (₦)
                            </label>
                            <input
                                type="number"
                                id="loanAmount"
                                value={loanAmount}
                                onChange={(e) => setLoanAmount(e.target.value)}
                                placeholder="Enter loan amount"
                                min="1"
                                max={eligibility?.maxLoanAmount || 1000000}
                                step="0.01"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                required
                                disabled={!eligibility?.isEligible}
                            />
                            {eligibility?.isEligible && (
                                <p className="mt-1 text-sm text-gray-500">
                                    Maximum: ₦{eligibility.maxLoanAmount.toLocaleString()}
                                </p>
                            )}
                        </div>

                        {/* Purpose */}
                        <div>
                            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
                                Purpose of Loan
                            </label>
                            <textarea
                                id="purpose"
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder="Please describe the purpose of this loan..."
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                required
                                disabled={!eligibility?.isEligible}
                            />
                        </div>

                        {/* Repayment Period */}
                        <div>
                            <label htmlFor="repaymentPeriod" className="block text-sm font-medium text-gray-700 mb-2">
                                Repayment Period (months)
                            </label>
                            <select
                                id="repaymentPeriod"
                                value={repaymentPeriod}
                                onChange={(e) => setRepaymentPeriod(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                disabled={!eligibility?.isEligible}
                            >
                                <option value="6">6 months</option>
                                <option value="12">12 months</option>
                                <option value="18">18 months</option>
                                <option value="24">24 months</option>
                            </select>
                        </div>

                        {/* Loan Terms */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-medium text-blue-800 mb-2">Loan Terms:</h3>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Interest rate: 5% per annum</li>
                                <li>• Processing fee: 1% of loan amount</li>
                                <li>• Minimum contribution period: 6 months</li>
                                <li>• Maximum loan amount: 6x your contribution balance</li>
                                <li>• Repayment starts 30 days after loan approval</li>
                            </ul>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !eligibility?.isEligible}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Loan Application'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
