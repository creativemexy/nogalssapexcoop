'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Redirect to role-specific dashboard
    const dashboardMap: Record<string, string> = {
      SUPER_ADMIN: '/dashboard/super-admin',
      APEX: '/dashboard/apex',
      LEADER: '/dashboard/leader',
      COOPERATIVE: '/dashboard/cooperative',
      MEMBER: '/dashboard/member',
      BUSINESS: '/dashboard/business',
    };

    const redirectPath = dashboardMap[session.user?.role as string];
    if (redirectPath) {
      router.push(redirectPath);
    } else {
      router.push('/dashboard/unauthorized');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
} 