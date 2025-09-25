'use client';

import { useEffect, useState } from 'react';

export default function ApexFundsPage() {
  const [stats, setStats] = useState({ totalInflow: 0, totalOutflow: 0, netBalance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/apex-funds/dashboard-stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Apex Funds Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Inflow</h3>
          <p className="text-3xl font-bold text-green-600">₦{stats.totalInflow.toLocaleString()}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Outflow</h3>
          <p className="text-3xl font-bold text-red-600">₦{stats.totalOutflow.toLocaleString()}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Net Balance</h3>
          <p className="text-3xl font-bold text-blue-600">₦{stats.netBalance.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
