'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface RegistrationFeeData {
  registrationFee: number;
  registrationFeeFormatted: string;
  currency: string;
}

export default function RegistrationFeeSettingsPage() {
  const { data: session } = useSession();
  const [feeData, setFeeData] = useState<RegistrationFeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newFee, setNewFee] = useState('');

  useEffect(() => {
    fetchRegistrationFee();
  }, []);

  const fetchRegistrationFee = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/settings/registration-fee');
      const data = await response.json();
      
      if (response.ok) {
        setFeeData(data);
        setNewFee((data.registrationFee / 100).toString()); // Convert from kobo to naira
      } else {
        setError(data.error || 'Failed to fetch registration fee');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const feeInKobo = Math.round(parseFloat(newFee) * 100); // Convert naira to kobo
      
      const response = await fetch('/api/settings/registration-fee', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationFee: feeInKobo
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration fee updated successfully!');
        setFeeData(data);
        // Refresh the data
        await fetchRegistrationFee();
      } else {
        setError(data.error || 'Failed to update registration fee');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading registration fee settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Registration Fee Settings</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage the registration fee for cooperative registrations
            </p>
          </div>
          <Link
            href="/dashboard/apex"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Registration Fee */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Current Registration Fee</h2>
        {feeData && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Registration Fee</p>
              <p className="text-3xl font-bold text-green-600">{feeData.registrationFeeFormatted}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-300">Currency</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{feeData.currency}</p>
            </div>
          </div>
        )}
      </div>

      {/* Update Registration Fee Form */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Update Registration Fee</h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="newFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Registration Fee (₦)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₦</span>
              </div>
              <input
                type="number"
                id="newFee"
                value={newFee}
                onChange={(e) => setNewFee(e.target.value)}
                required
                min="10"
                step="0.01"
                className="block w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-100"
                placeholder="500.00"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Minimum fee is ₦10.00. Enter the amount in naira (₦).
            </p>
          </div>

          {/* Fee Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Important Information</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• This fee applies to all new cooperative registrations</li>
              <li>• The fee is charged via Paystack payment gateway</li>
              <li>• Changes take effect immediately for new registrations</li>
              <li>• Existing cooperatives are not affected by fee changes</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={fetchRegistrationFee}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Update Registration Fee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


