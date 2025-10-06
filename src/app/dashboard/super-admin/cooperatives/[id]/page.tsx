'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Cooperative {
  id: string;
  name: string;
  registrationNumber: string;
  city: string;
  state: string;
  status: string;
  createdAt: string;
  memberCount: number;
  leaderCount: number;
  email: string;
  phoneNumber: string;
  address: string;
  bankName: string;
  bankAccountNumber: string;
}

export default function CooperativeDetailsPage() {
  const params = useParams();
  const cooperativeId = params.id as string;
  const [cooperative, setCooperative] = useState<Cooperative | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooperativeId) {
      fetchCooperative();
    }
  }, [cooperativeId]);

  const fetchCooperative = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/cooperatives/${cooperativeId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cooperative');
      }
      
      setCooperative(data.cooperative);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-500">Loading cooperative details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <Link href="/dashboard/super-admin/cooperatives" className="text-green-600 hover:text-green-500 mt-4 inline-block">
          &larr; Back to Cooperatives
        </Link>
      </div>
    );
  }

  if (!cooperative) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-500 py-12">
          Cooperative not found
        </div>
        <Link href="/dashboard/super-admin/cooperatives" className="text-green-600 hover:text-green-500 mt-4 inline-block">
          &larr; Back to Cooperatives
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{cooperative.name}</h1>
        <div className="flex space-x-3">
          <Link 
            href={`/dashboard/super-admin/cooperatives/${cooperativeId}/edit`}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Edit
          </Link>
          <Link 
            href="/dashboard/super-admin/cooperatives"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to List
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Cooperative Information</h2>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{cooperative.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Registration Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{cooperative.registrationNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{cooperative.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{cooperative.phoneNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{cooperative.address}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-sm text-gray-900">{cooperative.city}, {cooperative.state}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Bank Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{cooperative.bankName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Bank Account Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{cooperative.bankAccountNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                {cooperative.status === 'Active' ? (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-500 rounded">
                    Inactive
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(cooperative.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Members</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {cooperative.memberCount} members, {cooperative.leaderCount} leaders
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
