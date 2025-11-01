'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SuperAdminWalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [memberAllocation, setMemberAllocation] = useState(0);
  const [coopAllocation, setCoopAllocation] = useState(0);
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [banks, setBanks] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [showModal, setShowModal] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchWallet();
    fetchBanks();
  }, [session, status]);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/wallet/super-admin');
      const data = await res.json();
      if (data?.success) {
        setBalance(Number(data.balance) || 0);
        setMemberAllocation(Number(data.memberAmount) || 0);
        setCoopAllocation(Number(data.cooperativeAmount) || 0);
        setWithdrawals(data.withdrawals || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch('/api/banks/list');
      const data = await res.json();
      if (Array.isArray(data?.banks)) setBanks(data.banks);
    } catch {}
  };

  const withdraw = async () => {
    setMessage(null);
    if (!amount || amount <= 0) {
      setMessage('Enter a valid amount');
      return;
    }
    if (amount > balance) {
      setMessage('❌ Insufficient balance');
      // eslint-disable-next-line no-alert
      alert('Insufficient balance');
      return;
    }
    if (!bankCode || !accountNumber || !accountName) {
      setMessage('Provide bank details');
      return;
    }
    try {
      const res = await fetch('/api/admin/wallet/super-admin/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, note, bankCode, accountNumber, accountName }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400 && (data?.code === 'INSUFFICIENT_BALANCE' || String(data?.error || '').toLowerCase().includes('insufficient'))) {
          setMessage('❌ Insufficient balance');
          // eslint-disable-next-line no-alert
          alert('Insufficient balance');
          return;
        }
        throw new Error(data.error || 'Failed');
      }
      setMessage('✅ Withdrawal request submitted');
      setAmount(0);
      setNote('');
      setShowModal(false);
      fetchWallet();
    } catch (e: any) {
      setMessage(`❌ ${e.message}`);
    }
  };

  const resolveAccount = async () => {
    setResolving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/paystack/resolve-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber, bankCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Resolve failed');
      setAccountName(data.accountName || data.data?.account_name || '');
    } catch (e:any) {
      setMessage(`❌ ${e.message}`);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">💼 Super Admin Wallet</h1>
            <p className="mt-2 text-gray-600">View allocation and withdraw dynamically.</p>
          </div>
          <Link href="/dashboard/super-admin" className="text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </Link>
        </div>

        {message && (
          <div className="mb-6 p-3 rounded border text-sm bg-white">{message}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Current Balance</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">₦{balance.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Allocation per Member Registration</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">₦{memberAllocation.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Allocation per Cooperative Registration</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">₦{coopAllocation.toLocaleString()}</p>
          </div>
          
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Withdrawal</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (₦)</label>
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Continue</button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Withdrawals</h2>
            <div className="max-h-72 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Amount</th>
                    <th className="text-left px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="border-t">
                      <td className="px-3 py-2">{new Date(w.requestedAt).toLocaleString()}</td>
                      <td className="px-3 py-2">₦{Number(w.amount).toLocaleString()}</td>
                      <td className="px-3 py-2">{w.status}</td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-gray-500" colSpan={3}>No withdrawals yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank</label>
                <select value={bankCode} onChange={e => setBankCode(e.target.value)} className="mt-1 w-full border border-gray-300 rounded px-3 py-2">
                  <option value="">Select bank</option>
                  {banks.map(b => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Account Number</label>
                  <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} maxLength={10} className="mt-1 w-full border border-gray-300 rounded px-3 py-2" />
                </div>
                <div className="flex items-end">
                  <button onClick={resolveAccount} disabled={!bankCode || accountNumber.length !== 10 || resolving} className="w-full px-3 py-2 bg-gray-800 text-white rounded disabled:opacity-50">
                    {resolving ? 'Resolving...' : 'Resolve'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Name</label>
                <input value={accountName} onChange={e => setAccountName(e.target.value)} className="mt-1 w-full border border-gray-300 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Note (optional)</label>
                <input value={note} onChange={e => setNote(e.target.value)} className="mt-1 w-full border border-gray-300 rounded px-3 py-2" placeholder="e.g., Monthly payout" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button onClick={withdraw} className="px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


