'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function RegistrationErrorPage() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('An error occurred during registration');

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) setErrorMessage(message);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Registration Failed
          </h2>
          
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {errorMessage}
          </p>
        </div>

        {/* Error Details */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                ❌ Registration Failed
              </span>
            </div>
          </div>
        </div>

        {/* Help Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">
            What to do next?
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  If payment was successful but registration failed, contact support with your payment reference.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  If payment failed, you can try registering again with a different payment method.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Check your email for any notifications about the registration status.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Need Help?
          </h3>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              If you need assistance with your registration, please contact our support team:
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Email:</strong> support@nogalss.org
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Phone:</strong> +234 XXX XXX XXXX
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/auth/register"
            className="flex-1 bg-green-600 text-white text-center px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Registration Again
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


