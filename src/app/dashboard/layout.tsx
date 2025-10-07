'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import EmergencyAlertBanner from '@/components/EmergencyAlertBanner';
import NotificationBanner from '@/components/NotificationBanner';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [impersonationData, setImpersonationData] = useState<any>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  useEffect(() => {
    // Check for impersonation data in localStorage
    const storedData = localStorage.getItem('impersonationData');
    if (storedData) {
      try {
        setImpersonationData(JSON.parse(storedData));
      } catch (error) {
        console.error('Error parsing impersonation data:', error);
        localStorage.removeItem('impersonationData');
      }
    }
  }, []);

  const stopImpersonation = async () => {
    try {
      await fetch('/api/admin/impersonate/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      localStorage.removeItem('impersonationData');
      setImpersonationData(null);
      router.push('/dashboard/super-admin');
    } catch (error) {
      console.error('Error stopping impersonation:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Notification Banner */}
      <NotificationBanner />
      
      {/* Emergency Alert Banner */}
      <EmergencyAlertBanner />
      
      {/* Impersonation Banner */}
      {impersonationData && (
        <div className="bg-orange-100 dark:bg-orange-900 border-b border-orange-200 dark:border-orange-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  <strong>Impersonating:</strong> {impersonationData.firstName} {impersonationData.lastName} ({impersonationData.email}) - {impersonationData.role}
                </span>
              </div>
              <button
                onClick={stopImpersonation}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-orange-800 bg-orange-200 hover:bg-orange-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Stop Impersonation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <Image src="/logo.png" alt="Nogalss Logo" width={48} height={48} priority />
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-200">
                Welcome, {impersonationData ? `${impersonationData.firstName} ${impersonationData.lastName}` : session.user?.name}
              </span>
              {(session.user as any)?.role === 'SUPER_ADMIN' && !impersonationData && (
                <Link href="/dashboard/super-admin/profile" className="text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 text-sm">
                  Profile
                </Link>
              )}
              <button
                onClick={toggleTheme}
                className="flex items-center px-2 py-1 rounded text-sm border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.95 7.05l-.71-.71M6.34 6.34l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" /></svg>
                )}
                {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </button>
              <Link href="/api/auth/signout" className="text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 text-sm">
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
} 