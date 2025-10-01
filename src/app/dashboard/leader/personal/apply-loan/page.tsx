'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LoanEligibility {
  isEligible: boolean;
  eligibility: {
    requiredMonths: number;
    actualMonths: number;
    monthsRemaining: number;
    totalContributions: number;
    maxLoanAmount: number;
    recentContributions: Array<{
      amount: number;
      description: string;
      createdAt: string;
      month: string;
    }>;
  };
  message: string;
}

export default function LeaderApplyLoanPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<LoanEligibility | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    duration: '12',
    collateral: '',
    repaymentPlan: 'MONTHLY'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Check for impersonation data
      const impersonationData = localStorage.getItem('impersonationData');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (impersonationData) {
        headers['x-impersonation-data'] = impersonationData;
      }

      const response = await fetch('/api/leader/personal/apply-loan', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Loan application submitted successfully!');
        setFormData({ 
          amount: '', 
          purpose: '', 
          duration: '12', 
          collateral: '', 
          repaymentPlan: 'MONTHLY' 
        });
      } else {
        setError(data.error || 'Failed to submit loan application');
      }
    } catch (err) {
      setError('Network error - unable to submit loan application');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const fetchEligibility = async () => {
    try {
      setEligibilityLoading(true);
      
      // Check for impersonation data
      const impersonationData = localStorage.getItem('impersonationData');
      const headers: Record<string, string> = {};
      
      if (impersonationData) {
        headers['x-impersonation-data'] = impersonationData;
      }
      
      const response = await fetch('/api/leader/personal/loan-eligibility', {
        headers
      });
      const data = await response.json();
      
      if (response.ok) {
        setEligibility(data);
      } else {
        setError(data.error || 'Failed to check loan eligibility');
      }
    } catch (err) {
      setError('Network error - unable to check loan eligibility');
    } finally {
      setEligibilityLoading(false);
    }
  };

  useEffect(() => {
    fetchEligibility();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Link href="/dashboard/leader" className="hover:text-gray-700">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900">Apply for Loan</span>
        </nav>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Apply for a Loan</h1>
          <p className="mt-2 text-gray-600">
            Submit a loan application as a cooperative member
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loan Eligibility Status */}
      {eligibilityLoading ? (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Checking loan eligibility...</p>
          </div>
        </div>
      ) : eligibility && (
        <div className={`rounded-lg shadow p-6 mb-6 ${eligibility.isEligible ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {eligibility.isEligible ? (
                <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-lg font-medium ${eligibility.isEligible ? 'text-green-800' : 'text-yellow-800'}`}>
                {eligibility.isEligible ? 'Loan Eligible' : 'Loan Not Eligible'}
              </h3>
              <p className={`mt-1 text-sm ${eligibility.isEligible ? 'text-green-700' : 'text-yellow-700'}`}>
                {eligibility.message}
              </p>
              
              {eligibility.isEligible && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">Contribution Balance</h4>
                    <p className="text-2xl font-bold text-green-600">
                      ₦{eligibility.eligibility.totalContributions.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">Maximum Loan Amount</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      ₦{eligibility.eligibility.maxLoanAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              
              {!eligibility.isEligible && (
                <div className="mt-4 bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Contribution Progress</h4>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${(eligibility.eligibility.actualMonths / eligibility.eligibility.requiredMonths) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-3 text-sm text-gray-600">
                      {eligibility.eligibility.actualMonths}/{eligibility.eligibility.requiredMonths} months
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    You need {eligibility.eligibility.monthsRemaining} more months of contributions to be eligible.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loan Application Form */}
      <div className="bg-white rounded-lg shadow p-6">
        {eligibility && !eligibility.isEligible ? (
          <div className="text-center py-8">
            <div className="text-yellow-500 text-6xl mb-4">🔒</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loan Application Not Available</h3>
            <p className="text-gray-600 mb-4">
              You need to complete 6 months of constant contributions before you can apply for a loan.
            </p>
            <Link
              href="/dashboard/leader/personal/contribute"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Make a Contribution
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Loan Amount *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₦</span>
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="10000"
                max={eligibility?.eligibility.maxLoanAmount || undefined}
                step="1000"
                className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0.00"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Minimum: ₦10,000 | Maximum: ₦{eligibility?.eligibility.maxLoanAmount.toLocaleString() || '0'}
            </p>
          </div>

          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
              Purpose of Loan *
            </label>
            <textarea
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              required
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Describe the purpose of this loan (e.g., business expansion, education, medical expenses, etc.)..."
            />
            <p className="mt-1 text-sm text-gray-500">Provide detailed information about how you plan to use the loan</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Repayment Duration (Months) *
              </label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="18">18 months</option>
                <option value="24">24 months</option>
                <option value="36">36 months</option>
              </select>
            </div>

            <div>
              <label htmlFor="repaymentPlan" className="block text-sm font-medium text-gray-700 mb-2">
                Repayment Plan *
              </label>
              <select
                id="repaymentPlan"
                name="repaymentPlan"
                value={formData.repaymentPlan}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="SEMI_ANNUAL">Semi-Annual</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="collateral" className="block text-sm font-medium text-gray-700 mb-2">
              Collateral/Security (Optional)
            </label>
            <textarea
              id="collateral"
              name="collateral"
              value={formData.collateral}
              onChange={handleChange}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Describe any collateral or security you can provide (e.g., property, vehicle, savings, etc.)..."
            />
            <p className="mt-1 text-sm text-gray-500">Optional: Any assets you can use as security for the loan</p>
          </div>

          {/* Loan Guidelines */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Loan Application Guidelines</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Eligibility:</strong> 6 months of constant contributions required</li>
              <li>• <strong>Maximum Amount:</strong> 6 times your total contribution balance</li>
              <li>• <strong>Minimum Amount:</strong> ₦10,000</li>
              <li>• <strong>Interest Rate:</strong> Determined based on loan amount and duration</li>
              <li>• <strong>Approval:</strong> Subject to cooperative policies and your financial standing</li>
              <li>• <strong>Repayment:</strong> Must be completed within the selected duration</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/leader"
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
