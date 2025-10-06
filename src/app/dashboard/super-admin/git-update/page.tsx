'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GitUpdatePage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleUpdate = async () => {
    if (!confirm('Are you sure you want to update the code?')) {
      return;
    }

    setUpdating(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/git-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setMessage(data.message || 'Update completed');
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin h-10 w-10 border-b-2 border-green-600 rounded-full"></div>
      </div>
    );
  }

  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Git Update Manager</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Check for updates and manage code deployments</p>
          </div>
          <Link href="/dashboard/super-admin">
            <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Update Code</h2>
        
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            This will pull the latest changes from the GitHub repository and restart the application.
          </p>
          
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {updating ? 'Updating...' : 'Update Code'}
          </button>
          
          {message && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}