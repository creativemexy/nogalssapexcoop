'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface TableRow {
  [key: string]: any;
}

export default function DatabaseAdminPage() {
  const { data: session, status } = useSession();
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/db');
      const data = await res.json();
      if (res.ok) setTables(data.tables);
      else setError(data.error || 'Failed to fetch tables');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (table: string, pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, page: pageNum, pageSize }),
      });
      const data = await res.json();
      if (res.ok) {
        setRows(data.rows);
        setColumns(data.rows[0] ? Object.keys(data.rows[0]) : []);
        setTotal(data.total);
        setPage(data.page);
      } else {
        setError(data.error || 'Failed to fetch table data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch table data');
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (table: string) => {
    setSelectedTable(table);
    setPage(1);
    fetchTableData(table, 1);
  };

  const handlePageChange = (newPage: number) => {
    if (selectedTable) fetchTableData(selectedTable, newPage);
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin h-10 w-10 border-b-2 border-green-600 rounded-full"></div></div>;
  }
  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="text-center"><h2 className="text-2xl font-bold text-red-600">Access Denied</h2><p className="text-gray-600 dark:text-gray-300">You do not have permission to view this page.</p></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Database Management</h1>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Table</label>
        <select
          className="w-full max-w-xs p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          value={selectedTable || ''}
          onChange={e => handleTableSelect(e.target.value)}
        >
          <option value="">-- Choose a table --</option>
          {tables.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {error && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
      {loading && <div className="mb-4 text-gray-600 dark:text-gray-300">Loading...</div>}
      {selectedTable && !loading && (
        <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded shadow p-4">
          <div className="mb-2 text-sm text-gray-700 dark:text-gray-300">Showing {rows.length} of {total} rows</div>
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr>
                {columns.map(col => <th key={col} className="px-2 py-1 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {columns.map(col => <td key={col} className="px-2 py-1 border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200">{String(row[col])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
            >Prev</button>
            <span className="text-gray-700 dark:text-gray-300">Page {page} of {Math.ceil(total / pageSize)}</span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page * pageSize >= total}
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
