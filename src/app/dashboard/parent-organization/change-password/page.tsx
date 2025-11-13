'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import PasswordInput from '@/components/ui/PasswordInput';
import PasswordHints from '@/components/ui/PasswordHints';
import { validatePassword, getPasswordPolicyMessage } from '@/lib/utils';

export default function ParentOrganizationChangePasswordPage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Enforce strong password policy
    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      setError(
        'Password does not meet security requirements:\n' +
        passwordValidation.errors.join('\n') +
        '\n\n' +
        getPasswordPolicyMessage()
      );
      return;
    }

    if (formData.newPassword === formData.currentPassword) {
      setError('New password must be different from current password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
              <p className="mt-2 text-gray-600">
                Update your account password
              </p>
            </div>
            <Link
              href="/dashboard/parent-organization"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Password Changed Successfully</h3>
                <div className="mt-2 text-sm text-green-700">
                  Your password has been updated successfully. Please use your new password for future logins.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Change Your Password</h3>
            <p className="mt-1 text-sm text-gray-600">
              Enter your current password and choose a new secure password.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <PasswordInput
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="Enter your new password"
                required
                autoComplete="new-password"
                disabled={loading}
              />
              {formData.newPassword && <PasswordHints password={formData.newPassword} />}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your new password"
                required
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• At least 8 characters long (recommended: 12+)</li>
                <li>• At least one uppercase letter (A-Z)</li>
                <li>• At least one lowercase letter (a-z)</li>
                <li>• At least one number (0-9)</li>
                <li>• At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)</li>
                <li>• Must be different from your current password</li>
                <li>• Avoid common patterns and sequential characters</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href="/dashboard/parent-organization"
                className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Security Tips */}
        <div className="mt-8 bg-yellow-50 rounded-lg p-6">
          <h4 className="text-md font-medium text-yellow-800 mb-3">Security Tips</h4>
          <ul className="text-sm text-yellow-700 space-y-2">
            <li>• Use a unique password that you don't use for other accounts</li>
            <li>• Consider using a password manager to generate and store secure passwords</li>
            <li>• Never share your password with anyone</li>
            <li>• Log out from all devices if you suspect your account has been compromised</li>
            <li>• Enable two-factor authentication for additional security</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
