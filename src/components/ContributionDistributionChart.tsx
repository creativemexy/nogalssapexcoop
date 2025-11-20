'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ContributionDistribution {
  name: string;
  value: number;
  count: number;
  id: string;
}

interface DistributionData {
  distribution: ContributionDistribution[];
  totalAmount: number;
  period: string;
  groupBy: string;
  count: number;
}

interface ContributionDistributionChartProps {
  apiEndpoint?: string;
  parentOrganizationId?: string;
  cooperativeId?: string;
  title?: string;
}

const COLORS = [
  '#10b981', // green-500
  '#f59e0b', // yellow-500
  '#3b82f6', // blue-500
  '#8b5cf6', // purple-500
  '#ef4444', // red-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#6366f1', // indigo-500
];

export default function ContributionDistributionChart({
  apiEndpoint = '/api/contributions/distribution',
  parentOrganizationId,
  cooperativeId,
  title = 'Contribution Distribution',
}: ContributionDistributionChartProps) {
  const [distributionData, setDistributionData] = useState<DistributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<'cooperative' | 'month'>('cooperative');
  const [period, setPeriod] = useState<'all' | 'month' | 'year'>('all');

  useEffect(() => {
    const fetchDistribution = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          groupBy: groupBy,
          period: period,
        });
        
        if (parentOrganizationId) {
          params.append('parentOrganizationId', parentOrganizationId);
        }
        if (cooperativeId) {
          params.append('cooperativeId', cooperativeId);
        }

        const res = await fetch(`${apiEndpoint}?${params}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!res.ok) throw new Error('Failed to fetch contribution distribution');
        const data = await res.json();
        setDistributionData(data);
      } catch (err: any) {
        console.error('Error fetching distribution:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDistribution();
  }, [groupBy, period, parentOrganizationId, cooperativeId, apiEndpoint]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">{title}</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as 'cooperative' | 'month')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="cooperative">By Cooperative</option>
            <option value="month">By Month</option>
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'all' | 'month' | 'year')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Time</option>
            <option value="year">This Year</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : distributionData && distributionData.distribution.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData.distribution as any}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.distribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `₦${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600 mb-4">
              <p className="font-semibold text-gray-900">Total: ₦{distributionData.totalAmount.toLocaleString()}</p>
              <p>{distributionData.count} {groupBy === 'cooperative' ? 'Cooperatives' : 'Months'}</p>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {distributionData.distribution.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">₦{item.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {((item.value / distributionData.totalAmount) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No contribution data available</p>
        </div>
      )}
    </div>
  );
}


