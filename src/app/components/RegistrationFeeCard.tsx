import { useEffect, useState } from 'react';

export default function RegistrationFeeCard({ canEdit = false, showTitle = true }: { canEdit?: boolean; showTitle?: boolean }) {
  const [fee, setFee] = useState<number | null>(null);
  const [inputFee, setInputFee] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/settings/registration-fee')
      .then(res => res.json())
      .then(data => {
        setFee(data.fee);
        setInputFee(data.fee?.toString() ?? '');
      })
      .catch(() => setError('Failed to fetch registration fee'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/settings/registration-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fee: Number(inputFee) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update fee');
      setFee(data.fee);
      setSuccess('Registration fee updated!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500 max-w-md mx-auto mb-8">
      {showTitle && <h2 className="text-lg font-bold text-green-700 mb-2">Registration Fee</h2>}
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <>
          {canEdit ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={inputFee}
                onChange={e => setInputFee(e.target.value)}
                className="border border-yellow-400 rounded-md px-3 py-2 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 w-32"
              />
              <span className="text-green-700 font-semibold text-lg">₦</span>
              <button
                onClick={handleSave}
                disabled={saving || !inputFee}
                className="ml-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <div className="text-2xl font-bold text-green-700">₦{fee?.toLocaleString() ?? 0}</div>
          )}
          {success && <div className="text-green-600 mt-2">{success}</div>}
        </>
      )}
    </div>
  );
} 