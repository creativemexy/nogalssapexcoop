'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface BackupFile {
  filename: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  path: string;
}

export default function DatabaseManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [backupName, setBackupName] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchBackups();
  }, [session, status]);

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/admin/database/backups');
      const data = await res.json();
      if (data.success) setBackups(data.backups);
    } catch {}
  };

  const createBackup = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const res = await fetch('/api/admin/database/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupName: backupName.trim() || undefined })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Backup failed');
      }
      setMessage('✅ Backup created');
      setBackupName('');
      fetchBackups();
    } catch (e: any) {
      setMessage(`❌ ${e.message || 'Internal server error'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetDatabase = async () => {
    if (confirmText.trim().toUpperCase() !== 'RESET DATABASE') {
      setMessage('❗ Type RESET DATABASE to confirm');
      return;
    }
    try {
      setLoading(true);
      setMessage(null);
      const res = await fetch('/api/admin/database/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alsoBackup: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setMessage('✅ Database reset complete. Super admin preserved.');
      setConfirmText('');
    } catch (e: any) {
      setMessage(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🗄️ Database Management</h1>
            <p className="mt-2 text-gray-600">Create backups and safely reset the database (super admin accounts are preserved).</p>
          </div>
          <Link href="/dashboard/super-admin" className="text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </Link>
        </div>

        {message && (
          <div className="mb-6 p-3 rounded border text-sm bg-white">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Backup Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📦 Create Backup</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional backup name"
              />
              <button
                onClick={createBackup}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Working...' : 'Create Backup'}
              </button>
            </div>

            <h3 className="text-md font-semibold text-gray-900 mt-6 mb-2">Existing Backups</h3>
            <div className="max-h-64 overflow-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Filename</th>
                    <th className="text-left px-3 py-2">Size</th>
                    <th className="text-left px-3 py-2">Created</th>
                    <th className="text-left px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((b) => (
                    <tr key={b.filename} className="border-t">
                      <td className="px-3 py-2">{b.filename}</td>
                      <td className="px-3 py-2">{(b.size / 1024 / 1024).toFixed(2)} MB</td>
                      <td className="px-3 py-2">{new Date(b.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2 space-x-2">
                        <a
                          href={`/api/admin/database/backup/${encodeURIComponent(b.filename)}`}
                          className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900"
                        >Download</a>
                        <button
                          onClick={async () => {
                            setLoading(true);
                            setMessage(null);
                            try {
                              const res = await fetch('/api/admin/database/restore', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ filename: b.filename })
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error || 'Restore failed');
                              setMessage('✅ Restore completed successfully');
                            } catch (e:any) {
                              setMessage(`❌ ${e.message}`);
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          disabled={loading}
                        >Restore</button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to delete "${b.filename}"? This action cannot be undone.`)) {
                              return;
                            }
                            setLoading(true);
                            setMessage(null);
                            try {
                              const res = await fetch(`/api/admin/database/backup/${encodeURIComponent(b.filename)}`, {
                                method: 'DELETE'
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error || 'Delete failed');
                              setMessage('✅ Backup deleted successfully');
                              fetchBackups();
                            } catch (e:any) {
                              setMessage(`❌ ${e.message}`);
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                          disabled={loading}
                        >Delete</button>
                      </td>
                    </tr>
                  ))}
                  {backups.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-gray-500" colSpan={4}>No backups yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload .sql to Restore</label>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const input = document.getElementById('restoreFile') as HTMLInputElement;
                  if (!input?.files || input.files.length === 0) return;
                  const form = new FormData();
                  form.append('file', input.files[0]);
                  setLoading(true);
                  setMessage(null);
                  try {
                    const res = await fetch('/api/admin/database/restore', { method: 'POST', body: form });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Restore failed');
                    setMessage('✅ Restore completed successfully');
                  } catch (e:any) {
                    setMessage(`❌ ${e.message}`);
                  } finally {
                    setLoading(false);
                    (document.getElementById('restoreFile') as HTMLInputElement).value = '';
                  }
                }}
                className="flex items-center gap-3"
              >
                <input id="restoreFile" type="file" accept=".sql" className="border border-gray-300 rounded px-3 py-2" />
                <button type="submit" disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">Upload & Restore</button>
              </form>
            </div>
          </div>

          {/* Reset Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🧹 Reset Database</h2>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-900 mb-4">
              This will delete ALL data except super admin user accounts. A backup will be created automatically.
            </div>
            <div className="space-y-3">
              <label className="block text-sm text-gray-700">Type <span className="font-semibold">RESET DATABASE</span> to confirm</label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="RESET DATABASE"
              />
              <button
                onClick={resetDatabase}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Database'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
