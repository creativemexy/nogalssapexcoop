'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface Row {
  id: string;
  reference: string;
  payer: string;
  email: string;
  cooperative: string;
  amount: number;
  apexFunds: number;
  nogalssFunds: number;
  cooperativeShare: number;
  leaderShare: number;
  createdAt: string;
}

export default function AdministrativeFeesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [totals, setTotals] = useState({ totalAmount: 0, apexFunds: 0, nogalssFunds: 0, cooperativeShare: 0, leaderShare: 0 });

  useEffect(() => {
    fetchData();
  }, [page, search]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/administrative-fees?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch fees');
      setRows(data.rows || []);
      setPages(data.pagination?.pages || 1);
      setTotals(data.totals || totals);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const csv = useMemo(() => {
    const header = ['Date','Payer','Email','Cooperative','Reference','Amount','Apex (40%)','Nogalss (20%)','Coop (20%)','Leader (20%)'];
    const lines = rows.map(r => [
      new Date(r.createdAt).toISOString(),
      r.payer,
      r.email,
      r.cooperative,
      r.reference,
      r.amount,
      r.apexFunds,
      r.nogalssFunds,
      r.cooperativeShare,
      r.leaderShare,
    ]);
    return [header, ...lines].map(arr => arr.join(',')).join('\n');
  }, [rows]);

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard');
    } catch {
      alert('Failed to copy link');
    }
  };

  const downloadCsv = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'administrative_fees.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Administrative Fees (Registration Splits)</h1>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/super-admin" className="text-green-600 hover:text-green-500 underline">&larr; Back to Dashboard</Link>
          <button onClick={copyShare} className="px-3 py-2 border rounded-md text-sm">Copy Share Link</button>
          <button onClick={downloadCsv} className="px-3 py-2 bg-green-600 text-white rounded-md text-sm">Export CSV</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <SummaryCard title="Total Amount" value={totals.totalAmount} />
          <SummaryCard title="Apex (40%)" value={totals.apexFunds} />
          <SummaryCard title="Nogalss (20%)" value={totals.nogalssFunds} />
          <SummaryCard title="Cooperative (20%)" value={totals.cooperativeShare} />
          <SummaryCard title="Leader (20%)" value={totals.leaderShare} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData(); }} className="flex gap-2 w-full md:w-1/2">
            <input
              type="text"
              placeholder="Search by payer, email, coop, reference..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Search</button>
          </form>
        </div>

        {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-500">Loading fees...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-green-50">
                <tr>
                  <Th>Date</Th>
                  <Th>Payer</Th>
                  <Th>Email</Th>
                  <Th>Cooperative</Th>
                  <Th>Reference</Th>
                  <Th className="text-right">Amount</Th>
                  <Th className="text-right">Apex (40%)</Th>
                  <Th className="text-right">Nogalss (20%)</Th>
                  <Th className="text-right">Coop (20%)</Th>
                  <Th className="text-right">Leader (20%)</Th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <Td>{new Date(r.createdAt).toLocaleString()}</Td>
                    <Td>{r.payer}</Td>
                    <Td>{r.email}</Td>
                    <Td>{r.cooperative}</Td>
                    <Td>{r.reference}</Td>
                    <Td className="text-right">₦{r.amount.toLocaleString()}</Td>
                    <Td className="text-right">₦{r.apexFunds.toLocaleString()}</Td>
                    <Td className="text-right">₦{r.nogalssFunds.toLocaleString()}</Td>
                    <Td className="text-right">₦{r.cooperativeShare.toLocaleString()}</Td>
                    <Td className="text-right">₦{r.leaderShare.toLocaleString()}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">Page {page} of {pages}</div>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: number; }) {
  return (
    <div className="p-4 border rounded-lg">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-xl font-semibold text-gray-900">₦{(value || 0).toLocaleString()}</p>
    </div>
  );
}

function Th({ children, className = '' }: any) {
  return <th className={`px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider ${className}`}>{children}</th>;
}
function Td({ children, className = '' }: any) {
  return <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>{children}</td>;
}






