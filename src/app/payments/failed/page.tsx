import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Failed
        </h2>
        
        <p className="text-gray-600 mb-6">
          Unfortunately, your payment could not be processed. Please try again or contact support if the problem persists.
        </p>
        
        <div className="space-y-3">
          <Link href="/dashboard">
            <Button className="w-full">
              Go to Dashboard
            </Button>
          </Link>
          
          <Link href="/payments/retry">
            <Button variant="outline" className="w-full">
              Try Again
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 