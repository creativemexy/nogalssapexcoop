'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FeeData {
  memberFee: {
    amount: number;
    formatted: string;
    currency: string;
  };
  cooperativeFee: {
    amount: number;
    formatted: string;
    currency: string;
  };
}

export default function RegistrationFeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feeData, setFeeData] = useState<FeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [memberFee, setMemberFee] = useState('');
  const [cooperativeFee, setCooperativeFee] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || (session.user as any)?.role !== 'APEX') {
      router.push('/auth/signin');
      return;
    }
    
    fetchFees();
  }, [session, status, router]);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/apex/registration-fees');
      
      if (!response.ok) {
        throw new Error('Failed to fetch registration fees');
      }
      
      const data = await response.json();
      setFeeData(data);
      
      // Set form values
      setMemberFee((data.memberFee.amount / 100).toString());
      setCooperativeFee((data.cooperativeFee.amount / 100).toString());
      
    } catch (err) {
      console.error('Error fetching fees:', err);
      setError('Failed to load registration fees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/apex/registration-fees', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberFee: Math.round(parseFloat(memberFee) * 100), // Convert to kobo
          cooperativeFee: Math.round(parseFloat(cooperativeFee) * 100), // Convert to kobo
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update registration fees');
      }

      setSuccess('Registration fees updated successfully!');
      
      // Refresh the data
      await fetchFees();
      
    } catch (err) {
      console.error('Error updating fees:', err);
      setError(err instanceof Error ? err.message : 'Failed to update registration fees');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setMemberFee('500');
    setCooperativeFee('50000');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Registration Fee Management
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage member and cooperative registration fees
              </p>
            </div>
            <Link
              href="/dashboard/apex"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Current Fees Display */}
        {feeData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Current Member Fee
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {feeData.memberFee.formatted}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Individual member registration
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Current Cooperative Fee
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {feeData.cooperativeFee.formatted}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Cooperative organization registration
              </p>
            </div>
          </div>
        )}

        {/* Fee Management Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Update Registration Fees
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Set new registration fees for members and cooperatives
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Member Fee */}
              <div>
                <label htmlFor="memberFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Member Registration Fee (₦)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₦</span>
                  </div>
                  <input
                    type="number"
                    id="memberFee"
                    value={memberFee}
                    onChange={(e) => setMemberFee(e.target.value)}
                    min="10"
                    max="100000"
                    step="0.01"
                    className="pl-8 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="500.00"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Minimum: ₦10.00, Maximum: ₦100,000.00
                </p>
              </div>

              {/* Cooperative Fee */}
              <div>
                <label htmlFor="cooperativeFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cooperative Registration Fee (₦)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₦</span>
                  </div>
                  <input
                    type="number"
                    id="cooperativeFee"
                    value={cooperativeFee}
                    onChange={(e) => setCooperativeFee(e.target.value)}
                    min="10"
                    max="1000000"
                    step="0.01"
                    className="pl-8 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="50000.00"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Minimum: ₦10.00, Maximum: ₦1,000,000.00
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
              <button
                type="button"
                onClick={resetToDefaults}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Reset to Defaults
              </button>
              
              <div className="flex space-x-3">
                <Link
                  href="/dashboard/apex"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Updating...' : 'Update Fees'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Information Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            💡 Fee Management Information
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>• <strong>Member Registration Fee:</strong> Charged to individual members joining existing cooperatives</p>
            <p>• <strong>Cooperative Registration Fee:</strong> Charged to organizations registering new cooperatives</p>
            <p>• <strong>Payment Processing:</strong> Paystack fees (1.5% + ₦100) are added to the base fee</p>
            <p>• <strong>Database Records:</strong> Only the base fee is recorded in business transactions</p>
            <p>• <strong>Fee Caps:</strong> Paystack fees are capped at ₦2,000 and waived for amounts under ₦2,500</p>
          </div>
        </div>
      </div>
    </div>
  );
}
