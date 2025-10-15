'use client';

import React, { useState, useEffect } from 'react';

interface DataBreach {
  id: string;
  description: string;
  categories: string[];
  approximateDataSubjects: number;
  likelyConsequences: string;
  measuresProposed: string;
  status: string;
  reportedAt: string;
  reportedBy: string;
  reportedToAuthority: boolean;
  reportedToDataSubjects: boolean;
}

interface BreachForm {
  description: string;
  categories: string[];
  approximateDataSubjects: number;
  likelyConsequences: string;
  measuresProposed: string;
}

export default function BreachManagementPage() {
  const [breaches, setBreaches] = useState<DataBreach[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedBreach, setSelectedBreach] = useState<DataBreach | null>(null);
  const [formData, setFormData] = useState<BreachForm>({
    description: '',
    categories: [],
    approximateDataSubjects: 0,
    likelyConsequences: '',
    measuresProposed: ''
  });

  const categoryOptions = [
    'Personal Information',
    'Contact Details',
    'Financial Data',
    'Biometric Data',
    'Health Information',
    'Location Data',
    'Behavioral Data',
    'Communication Data',
    'Criminal Data',
    'Other'
  ];

  useEffect(() => {
    fetchBreaches();
  }, []);

  const fetchBreaches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/privacy-compliance/breaches');
      const data = await response.json();
      setBreaches(data.breaches || []);
    } catch (error) {
      console.error('Failed to fetch breaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/privacy-compliance/breaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({
          description: '',
          categories: [],
          approximateDataSubjects: 0,
          likelyConsequences: '',
          measuresProposed: ''
        });
        await fetchBreaches();
        alert('Data breach reported successfully');
      } else {
        alert('Failed to report breach');
      }
    } catch (error) {
      console.error('Failed to report breach:', error);
      alert('Failed to report breach');
    }
  };

  const handleStatusUpdate = async (breachId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/privacy-compliance/breaches/${breachId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchBreaches();
        alert('Breach status updated successfully');
      } else {
        alert('Failed to update breach status');
      }
    } catch (error) {
      console.error('Failed to update breach status:', error);
      alert('Failed to update breach status');
    }
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, category]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c !== category)
      }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'detected':
        return 'bg-red-100 text-red-800';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800';
      case 'contained':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityLevel = (dataSubjects: number, categories: string[]) => {
    const highRiskCategories = ['Biometric Data', 'Health Information', 'Financial Data', 'Criminal Data'];
    const hasHighRiskCategory = categories.some(cat => highRiskCategories.includes(cat));
    
    if (hasHighRiskCategory || dataSubjects > 1000) return 'High';
    if (dataSubjects > 100 || categories.length > 3) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Data Breach Management</h1>
              <p className="mt-2 text-gray-600">
                Report, track, and manage data breach incidents in compliance with NDPA requirements
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Report Breach
            </button>
          </div>
        </div>

        {/* Breach Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Data Breach</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Breach Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={4}
                    placeholder="Describe the data breach incident in detail..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Categories Affected *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryOptions.map(category => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(category)}
                          onChange={(e) => handleCategoryChange(category, e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approximate Number of Data Subjects Affected *
                  </label>
                  <input
                    type="number"
                    value={formData.approximateDataSubjects}
                    onChange={(e) => setFormData({ ...formData, approximateDataSubjects: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter approximate number of affected individuals"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Likely Consequences *
                  </label>
                  <textarea
                    value={formData.likelyConsequences}
                    onChange={(e) => setFormData({ ...formData, likelyConsequences: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Describe the likely consequences for data subjects..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Measures Proposed *
                  </label>
                  <textarea
                    value={formData.measuresProposed}
                    onChange={(e) => setFormData({ ...formData, measuresProposed: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Describe the measures proposed to address the breach..."
                    required
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 mb-2">⚠️ Important Notice</h3>
                  <p className="text-sm text-yellow-700">
                    Under the Nigeria Data Protection Act, you must notify the data protection authority 
                    within 72 hours if the breach is likely to result in a high risk to the rights and 
                    freedoms of data subjects.
                  </p>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Report Breach
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Breaches List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Data Breach Incidents</h2>
          </div>
          <div className="p-6">
            {breaches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No breaches reported</p>
            ) : (
              <div className="space-y-6">
                {breaches.map((breach) => (
                  <div key={breach.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{breach.description}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Reported:</strong> {new Date(breach.reportedAt).toLocaleString()}</p>
                            <p><strong>Reported by:</strong> {breach.reportedBy}</p>
                            <p><strong>Affected Subjects:</strong> {breach.approximateDataSubjects}</p>
                          </div>
                          <div>
                            <p><strong>Authority Notified:</strong> {breach.reportedToAuthority ? 'Yes' : 'No'}</p>
                            <p><strong>Data Subjects Notified:</strong> {breach.reportedToDataSubjects ? 'Yes' : 'No'}</p>
                            <p><strong>Severity:</strong> {getSeverityLevel(breach.approximateDataSubjects, breach.categories)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(breach.status)}`}>
                          {breach.status}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Affected Data Categories:</h4>
                      <div className="flex flex-wrap gap-2">
                        {breach.categories.map((category, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Likely Consequences:</h4>
                      <p className="text-sm text-gray-600">{breach.likelyConsequences}</p>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Proposed Measures:</h4>
                      <p className="text-sm text-gray-600">{breach.measuresProposed}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        {breach.status === 'detected' && (
                          <button
                            onClick={() => handleStatusUpdate(breach.id, 'investigating')}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Start Investigation
                          </button>
                        )}
                        {breach.status === 'investigating' && (
                          <button
                            onClick={() => handleStatusUpdate(breach.id, 'contained')}
                            className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
                          >
                            Mark as Contained
                          </button>
                        )}
                        {breach.status === 'contained' && (
                          <button
                            onClick={() => handleStatusUpdate(breach.id, 'resolved')}
                            className="text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            Mark as Resolved
                          </button>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedBreach(breach)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View Details
                        </button>
                        <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                          Generate Report
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

