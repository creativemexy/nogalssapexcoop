'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    // Sign out the user
    signOut({ 
      callbackUrl: '/auth/signin',
      redirect: true 
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Signing you out...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we log you out securely.
          </p>
        </div>
      </div>
    </div>
  );
}
