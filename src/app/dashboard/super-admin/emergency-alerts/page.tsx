'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface EmergencyAlert {
  id: string;
  title: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING';
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export default function EmergencyAlertsPage() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    severity: 'CRITICAL' as 'CRITICAL' | 'WARNING',
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/admin/emergency-alert');
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/emergency-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Emergency alert created and sent to all users!');
        setFormData({ title: '', message: '', severity: 'CRITICAL' });
        setShowCreateForm(false);
        fetchAlerts();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Failed to create alert');
    }
  };

  const handleDeactivateAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to deactivate this alert?')) return;

    try {
      const response = await fetch('/api/admin/emergency-alert', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId }),
      });

      if (response.ok) {
        alert('Alert deactivated successfully');
        fetchAlerts();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deactivating alert:', error);
      alert('Failed to deactivate alert');
    }
  };

  const getSeverityColor = (severity: string) => {
    return severity === 'CRITICAL' ? 'text-red-600 bg-red-100' : 'text-yellow-600 bg-yellow-100';
  };

  const getSeverityIcon = (severity: string) => {
    return severity === 'CRITICAL' ? '🚨' : '⚠️';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Loading emergency alerts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Emergency Alerts</h1>
        <div className="flex gap-3">
          <Link href="/dashboard/super-admin" className="text-red-600 hover:text-red-500 underline">
            ← Back to Dashboard
          </Link>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            🚨 Create Emergency Alert
          </button>
        </div>
      </div>

      {/* Create Alert Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Emergency Alert</h2>
            <form onSubmit={handleCreateAlert}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="Alert title"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  rows={4}
                  placeholder="Alert message"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as 'CRITICAL' | 'WARNING' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  <option value="CRITICAL">🚨 CRITICAL</option>
                  <option value="WARNING">⚠️ WARNING</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Send Alert
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow">
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🚨</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Emergency Alerts</h3>
            <p className="text-gray-600">All systems are operating normally.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{alert.message}</p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => handleDeactivateAlert(alert.id)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
