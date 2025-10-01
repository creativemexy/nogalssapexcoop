'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface SystemHealthMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  database: {
    connected: boolean;
    responseTime: number;
    activeConnections: number;
  };
  application: {
    uptime: number;
    nodeVersion: string;
    platform: string;
    arch: string;
  };
  alerts: HealthAlert[];
}

interface HealthAlert {
  id: string;
  type: 'WARNING' | 'CRITICAL' | 'INFO';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: string;
}

interface HealthData {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  metrics: SystemHealthMetrics;
  alerts: HealthAlert[];
  summary: {
    totalAlerts: number;
    criticalAlerts: number;
    warningAlerts: number;
  };
}

export default function SystemHealthDashboard() {
  const { data: session } = useSession();
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();

  useEffect(() => {
    fetchHealthData();
    
    // Set up real-time updates
    if (socket) {
      const handleUpdate = () => {
        fetchHealthData();
      };
      socket.on('dashboard:update', handleUpdate);
      return () => {
        socket.off('dashboard:update', handleUpdate);
      };
    }
  }, [socket]);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/admin/health');
      if (!response.ok) {
        throw new Error('Failed to fetch health data');
      }
      const data = await response.json();
      setHealthData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600 bg-green-100';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'CRITICAL': return 'text-red-600 bg-red-100 border-red-200';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'INFO': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system health...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Health Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchHealthData}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!healthData) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">System Health Monitor</h1>
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.status)}`}>
            {healthData.status}
          </div>
          <button
            onClick={fetchHealthData}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      {healthData.alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Active Alerts</h2>
          <div className="grid gap-4">
            {healthData.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{alert.message}</h3>
                    <p className="text-sm opacity-75">
                      {alert.metric}: {alert.value} (threshold: {alert.threshold})
                    </p>
                  </div>
                  <span className="text-xs opacity-75">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* CPU Usage */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">CPU Usage</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {healthData.metrics.cpu.usage}%
              </p>
              <p className="text-sm text-gray-500">
                {healthData.metrics.cpu.cores} cores
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  healthData.metrics.cpu.usage > 80 ? 'bg-red-500' :
                  healthData.metrics.cpu.usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(healthData.metrics.cpu.usage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Memory Usage</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {healthData.metrics.memory.usage}%
              </p>
              <p className="text-sm text-gray-500">
                {healthData.metrics.memory.used}GB / {healthData.metrics.memory.total}GB
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  healthData.metrics.memory.usage > 85 ? 'bg-red-500' :
                  healthData.metrics.memory.usage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(healthData.metrics.memory.usage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Disk Usage */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Disk Usage</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {healthData.metrics.disk.usage}%
              </p>
              <p className="text-sm text-gray-500">
                {healthData.metrics.disk.used}GB / {healthData.metrics.disk.total}GB
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  healthData.metrics.disk.usage > 90 ? 'bg-red-500' :
                  healthData.metrics.disk.usage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(healthData.metrics.disk.usage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Database</p>
              <p className={`text-2xl font-semibold ${
                healthData.metrics.database.connected ? 'text-green-600' : 'text-red-600'
              }`}>
                {healthData.metrics.database.connected ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-sm text-gray-500">
                {healthData.metrics.database.responseTime}ms response
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              healthData.metrics.database.connected ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
            }`}>
              <svg className={`w-6 h-6 ${
                healthData.metrics.database.connected ? 'text-green-600' : 'text-red-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Application Info */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Application Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Uptime</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatUptime(healthData.metrics.application.uptime)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Node Version</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {healthData.metrics.application.nodeVersion}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Platform</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {healthData.metrics.application.platform}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Architecture</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {healthData.metrics.application.arch}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Health Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {healthData.summary.totalAlerts}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Total Alerts</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">
              {healthData.summary.criticalAlerts}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Critical Alerts</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">
              {healthData.summary.warningAlerts}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Warning Alerts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
