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
  parentOrganizationShare: number;
  createdAt: string;
}

interface AllocationSettings {
  apexFunds: number;
  nogalssFunds: number;
  cooperativeShare: number;
  leaderShare: number;
  parentOrganizationShare: number;
}

export default function AdministrativeFeesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [totals, setTotals] = useState({ 
    totalAmount: 0, 
    apexFunds: 0, 
    nogalssFunds: 0, 
    cooperativeShare: 0, 
    leaderShare: 0,
    parentOrganizationShare: 0 
  });
  const [allocations, setAllocations] = useState<AllocationSettings>({
    apexFunds: 40,
    nogalssFunds: 20,
    cooperativeShare: 20,
    leaderShare: 15,
    parentOrganizationShare: 5
  });
  const [allocationTotal, setAllocationTotal] = useState(100);
  const [savingAllocations, setSavingAllocations] = useState(false);
  const [allocationSuccess, setAllocationSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchAllocations();
  }, [page, search]);

  // Calculate total allocation percentage whenever allocations change
  useEffect(() => {
    const total = Object.values(allocations).reduce((sum, val) => sum + val, 0);
    setAllocationTotal(total);
  }, [allocations]);

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

  const fetchAllocations = async () => {
    try {
      const response = await fetch('/api/admin/allocation-percentages');
      if (!response.ok) throw new Error('Failed to fetch allocation percentages');
      const data = await response.json();
      setAllocations(data.allocations);
    } catch (err) {
      console.error('Failed to fetch allocation percentages:', err);
    }
  };

  const saveAllocations = async () => {
    setSavingAllocations(true);
    setAllocationSuccess(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/allocation-percentages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocations }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save allocation percentages');
      }

      const data = await response.json();
      setAllocationSuccess(data.message || 'Allocation percentages saved successfully');
      setAllocationTotal(data.totalPercentage);
      
      // Refresh the data to show updated calculations
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save allocation percentages');
    } finally {
      setSavingAllocations(false);
    }
  };

  const csv = useMemo(() => {
    const header = ['Date','Payer','Email','Cooperative','Reference','Amount','Apex (%)','Nogalss (%)','Coop (%)','Leader (%)','Parent Org (%)'];
    const lines = rows.map(r => [
      new Date(r.createdAt).toISOString(),
      r.payer,
      r.email,
      r.cooperative,
      r.reference,
      r.amount || 0,
      r.apexFunds || 0,
      r.nogalssFunds || 0,
      r.cooperativeShare || 0,
      r.leaderShare || 0,
      r.parentOrganizationShare || 0,
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

      {/* Allocation Settings */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Allocation Settings</h2>
        <p className="text-sm text-gray-600 mb-6">
          Configure how registration fees are distributed among different stakeholders. 
          Total must equal 100%.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apex Funds (%)
            </label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              step="0.1"
              value={allocations.apexFunds} 
              onChange={e => {
                const value = parseFloat(e.target.value) || 0;
                setAllocations(prev => ({ ...prev, apexFunds: value }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nogalss Funds (%)
            </label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              step="0.1"
              value={allocations.nogalssFunds} 
              onChange={e => {
                const value = parseFloat(e.target.value) || 0;
                setAllocations(prev => ({ ...prev, nogalssFunds: value }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cooperative Share (%)
            </label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              step="0.1"
              value={allocations.cooperativeShare} 
              onChange={e => {
                const value = parseFloat(e.target.value) || 0;
                setAllocations(prev => ({ ...prev, cooperativeShare: value }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leader Share (%)
            </label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              step="0.1"
              value={allocations.leaderShare} 
              onChange={e => {
                const value = parseFloat(e.target.value) || 0;
                setAllocations(prev => ({ ...prev, leaderShare: value }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Organization (%)
            </label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              step="0.1"
              value={allocations.parentOrganizationShare} 
              onChange={e => {
                const value = parseFloat(e.target.value) || 0;
                setAllocations(prev => ({ ...prev, parentOrganizationShare: value }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500" 
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total Allocation:</span>
              <span className={`ml-2 text-lg font-bold ${Math.abs(allocationTotal - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                {allocationTotal.toFixed(1)}%
              </span>
            </div>
            {Math.abs(allocationTotal - 100) > 0.01 && (
              <span className="text-sm text-red-600">Total must equal exactly 100%</span>
            )}
          </div>
          
          <button 
            onClick={saveAllocations}
            disabled={savingAllocations || Math.abs(allocationTotal - 100) > 0.01}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingAllocations ? 'Saving...' : 'Save Allocation Settings'}
          </button>
        </div>
        
        {allocationSuccess && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {allocationSuccess}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <SummaryCard title="Total Amount" value={totals.totalAmount} />
          <SummaryCard title={`Apex (${allocations.apexFunds}%)`} value={totals.apexFunds} />
          <SummaryCard title={`Nogalss (${allocations.nogalssFunds}%)`} value={totals.nogalssFunds} />
          <SummaryCard title={`Cooperative (${allocations.cooperativeShare}%)`} value={totals.cooperativeShare} />
          <SummaryCard title={`Leader (${allocations.leaderShare}%)`} value={totals.leaderShare} />
          <SummaryCard title={`Parent Org (${allocations.parentOrganizationShare}%)`} value={totals.parentOrganizationShare} />
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
                  <Th className="text-right">{`Apex (${allocations.apexFunds}%)`}</Th>
                  <Th className="text-right">{`Nogalss (${allocations.nogalssFunds}%)`}</Th>
                  <Th className="text-right">{`Coop (${allocations.cooperativeShare}%)`}</Th>
                  <Th className="text-right">{`Leader (${allocations.leaderShare}%)`}</Th>
                  <Th className="text-right">{`Parent Org (${allocations.parentOrganizationShare}%)`}</Th>
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
                    <Td className="text-right">₦{(r.amount || 0).toLocaleString()}</Td>
                    <Td className="text-right">₦{(r.apexFunds || 0).toLocaleString()}</Td>
                    <Td className="text-right">₦{(r.nogalssFunds || 0).toLocaleString()}</Td>
                    <Td className="text-right">₦{(r.cooperativeShare || 0).toLocaleString()}</Td>
                    <Td className="text-right">₦{(r.leaderShare || 0).toLocaleString()}</Td>
                    <Td className="text-right">₦{(r.parentOrganizationShare || 0).toLocaleString()}</Td>
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






