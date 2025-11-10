'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WithdrawalPermissions {
  MEMBER: boolean;
  LEADER: boolean;
  COOPERATIVE: boolean;
  PARENT_ORGANIZATION: boolean;
}

export default function WithdrawalPermissionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<WithdrawalPermissions>({
    MEMBER: false,
    LEADER: false,
    COOPERATIVE: false,
    PARENT_ORGANIZATION: false,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchPermissions();
  }, [session, router]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/withdrawal-permissions');
      if (!response.ok) throw new Error('Failed to fetch permissions');
      const data = await response.json();
      if (data.success) {
        setPermissions(data.permissions || {
          MEMBER: false,
          LEADER: false,
          COOPERATIVE: false,
          PARENT_ORGANIZATION: false,
        });
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setMessage({ type: 'error', text: 'Failed to load withdrawal permissions' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (role: keyof WithdrawalPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      const response = await fetch('/api/admin/withdrawal-permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save permissions');
      }

      setMessage({ type: 'success', text: 'Withdrawal permissions updated successfully!' });
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save permissions' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const roleLabels: Record<keyof WithdrawalPermissions, string> = {
    MEMBER: 'Members',
    LEADER: 'Leaders',
    COOPERATIVE: 'Cooperatives',
    PARENT_ORGANIZATION: 'Parent Organizations',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdrawal Permissions</h1>
        <p className="text-gray-600">
          Enable or disable withdrawal functionality for each user role. When disabled, users will not be able to request withdrawals.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">User Role Permissions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Toggle withdrawal access for each user role below
          </p>
        </div>

        <div className="p-6 space-y-4">
          {(Object.keys(permissions) as Array<keyof WithdrawalPermissions>).map((role) => (
            <div
              key={role}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{roleLabels[role]}</h3>
                <p className="text-sm text-gray-500">
                  {permissions[role]
                    ? 'Withdrawals are currently enabled for this role'
                    : 'Withdrawals are currently disabled for this role'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions[role]}
                  onChange={() => handleToggle(role)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={fetchPermissions}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Important Notes</h3>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li>When withdrawals are disabled, users will not see withdrawal buttons or be able to access withdrawal pages</li>
          <li>Existing withdrawal requests will still be visible but new requests cannot be submitted</li>
          <li>Changes take effect immediately after saving</li>
        </ul>
      </div>
    </div>
  );
}

