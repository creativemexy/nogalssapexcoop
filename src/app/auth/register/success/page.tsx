'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';

function RegistrationSuccessContent() {
  const searchParams = useSearchParams();
  const [cooperativeName, setCooperativeName] = useState('');
  const [reference, setReference] = useState('');

  useEffect(() => {
    const cooperative = searchParams.get('cooperative');
    const ref = searchParams.get('reference');
    
    if (cooperative) setCooperativeName(cooperative);
    if (ref) setReference(ref);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Registration Successful!
          </h2>
          
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Your cooperative registration has been completed successfully.
          </p>
        </div>

        {/* Success Details */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Cooperative Name:</span>
              <span className="text-sm text-gray-900 dark:text-gray-100 font-semibold">{cooperativeName}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Reference:</span>
              <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">{reference}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                ✅ Payment Successful
              </span>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">
            Your Accounts Are Ready!
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Leader Account:</strong> Access your leadership dashboard to manage members and cooperative operations.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Cooperative Account:</strong> Access your organization dashboard with virtual account for contributions and loans.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Virtual Accounts:</strong> Both accounts have been created and are ready for use.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-900 dark:text-yellow-100 mb-4">
            Next Steps
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">1</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Check your email for login credentials and virtual account details.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">2</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Login to your leader or cooperative dashboard to start using the platform.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">3</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Start adding members to your cooperative and begin operations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/auth/signin"
            className="flex-1 bg-green-600 text-white text-center px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Sign In to Dashboard
          </Link>
          
          <Link
            href="/"
            className="flex-1 bg-gray-600 text-white text-center px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegistrationSuccessContent />
    </Suspense>
  );
}


