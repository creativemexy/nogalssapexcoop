'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

interface TwoFASetupData {
  otpauthUrl: string;
  qrDataUrl: string;
}

export default function TwoFASetupPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<TwoFASetupData | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [twoFAStatus, setTwoFAStatus] = useState<boolean | null>(null);

  useEffect(() => {
    fetch2FAStatus();
  }, []);

  const fetch2FAStatus = async () => {
    try {
      const response = await fetch('/api/user/2fa/status');
      const data = await response.json();
      setTwoFAStatus(data.enabled);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
      setLoading(false);
    }
  };

  const start2FASetup = async () => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      const response = await fetch('/api/user/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start 2FA setup');
      }

      setSetupData(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setVerifying(true);

      const response = await fetch('/api/user/2fa/setup', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      setSuccess('2FA has been successfully enabled!');
      setSetupData(null);
      setVerificationToken('');
      fetch2FAStatus();
      setVerifying(false);
    } catch (err: any) {
      setError(err.message);
      setVerifying(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      const response = await fetch('/api/user/2fa/setup', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA');
      }

      setSuccess('2FA has been successfully disabled!');
      fetch2FAStatus();
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading && twoFAStatus === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin h-10 w-10 border-b-2 border-green-600 rounded-full"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300">You must be logged in to access this page.</p>
          <Link href="/auth/signin" className="mt-4 inline-block text-green-600 hover:text-green-700">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Two-Factor Authentication Setup
              </h1>
              <Link 
                href="/dashboard" 
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="px-6 py-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
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

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <div className="mt-2 text-sm text-green-700">{success}</div>
                  </div>
                </div>
              </div>
            )}

            {twoFAStatus === true ? (
              <div className="text-center">
                <div className="mb-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  2FA is Currently Enabled
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Your account is protected with two-factor authentication.
                </p>
                <button
                  onClick={disable2FA}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Disabling...' : 'Disable 2FA'}
                </button>
              </div>
            ) : setupData ? (
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Scan QR Code with Your Authenticator App
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator to scan this QR code.
                </p>
                
                <div className="mb-6">
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                    <Image
                      src={setupData.qrDataUrl}
                      alt="2FA QR Code"
                      width={200}
                      height={200}
                      className="mx-auto"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Can't scan? Enter this code manually:
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md font-mono text-sm break-all">
                    {setupData.otpauthUrl}
                  </div>
                </div>

                <div className="max-w-sm mx-auto">
                  <label htmlFor="verification-token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter 6-digit code from your authenticator app:
                  </label>
                  <input
                    id="verification-token"
                    type="text"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  <button
                    onClick={verify2FA}
                    disabled={verifying || verificationToken.length !== 6}
                    className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifying ? 'Verifying...' : 'Verify & Enable 2FA'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Enable Two-Factor Authentication
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Add an extra layer of security to your account by enabling 2FA.
                </p>
                <button
                  onClick={start2FASetup}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Setting up...' : 'Start 2FA Setup'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
