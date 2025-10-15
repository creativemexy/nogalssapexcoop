'use client';

import React, { useState, useEffect } from 'react';

interface ImpactAssessment {
  id: string;
  activityId: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  riskLevel: string;
  mitigationMeasures: string[];
  assessmentDate: string;
  assessedBy: string;
  approvedBy?: string;
}

interface AssessmentForm {
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  dataMinimization: string;
  purposeLimitation: string;
  storageLimitation: string;
  accuracy: string;
  security: string;
  transparency: string;
}

export default function ImpactAssessmentPage() {
  const [assessments, setAssessments] = useState<ImpactAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AssessmentForm>({
    purpose: '',
    legalBasis: '',
    dataCategories: [],
    dataMinimization: '',
    purposeLimitation: '',
    storageLimitation: '',
    accuracy: '',
    security: '',
    transparency: ''
  });

  const dataCategoryOptions = [
    'Personal Information',
    'Contact Details',
    'Financial Data',
    'Biometric Data',
    'Health Information',
    'Location Data',
    'Behavioral Data',
    'Communication Data'
  ];

  const legalBasisOptions = [
    'Consent',
    'Contract',
    'Legal Obligation',
    'Vital Interests',
    'Public Task',
    'Legitimate Interests'
  ];

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/privacy-compliance/impact-assessments');
      const data = await response.json();
      setAssessments(data.assessments || []);
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/privacy-compliance/impact-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({
          purpose: '',
          legalBasis: '',
          dataCategories: [],
          dataMinimization: '',
          purposeLimitation: '',
          storageLimitation: '',
          accuracy: '',
          security: '',
          transparency: ''
        });
        await fetchAssessments();
        alert('Privacy Impact Assessment created successfully');
      } else {
        alert('Failed to create assessment');
      }
    } catch (error) {
      console.error('Failed to create assessment:', error);
      alert('Failed to create assessment');
    }
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        dataCategories: [...prev.dataCategories, category]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        dataCategories: prev.dataCategories.filter(c => c !== category)
      }));
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Privacy Impact Assessments</h1>
              <p className="mt-2 text-gray-600">
                Conduct and manage privacy impact assessments for data processing activities
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              New Assessment
            </button>
          </div>
        </div>

        {/* Assessment Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">New Privacy Impact Assessment</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose of Processing *
                  </label>
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Describe the purpose of the data processing activity..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Basis *
                  </label>
                  <select
                    value={formData.legalBasis}
                    onChange={(e) => setFormData({ ...formData, legalBasis: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select legal basis</option>
                    {legalBasisOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Categories *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {dataCategoryOptions.map(category => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.dataCategories.includes(category)}
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
                    Data Minimization *
                  </label>
                  <textarea
                    value={formData.dataMinimization}
                    onChange={(e) => setFormData({ ...formData, dataMinimization: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                    placeholder="How is data minimization implemented?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose Limitation *
                  </label>
                  <textarea
                    value={formData.purposeLimitation}
                    onChange={(e) => setFormData({ ...formData, purposeLimitation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                    placeholder="How is purpose limitation ensured?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Storage Limitation *
                  </label>
                  <textarea
                    value={formData.storageLimitation}
                    onChange={(e) => setFormData({ ...formData, storageLimitation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                    placeholder="How is storage limitation implemented?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Accuracy *
                  </label>
                  <textarea
                    value={formData.accuracy}
                    onChange={(e) => setFormData({ ...formData, accuracy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                    placeholder="How is data accuracy maintained?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Security Measures *
                  </label>
                  <textarea
                    value={formData.security}
                    onChange={(e) => setFormData({ ...formData, security: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                    placeholder="What security measures are in place?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transparency *
                  </label>
                  <textarea
                    value={formData.transparency}
                    onChange={(e) => setFormData({ ...formData, transparency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                    placeholder="How is transparency ensured?"
                    required
                  />
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
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Create Assessment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assessments List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Privacy Impact Assessments</h2>
          </div>
          <div className="p-6">
            {assessments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No assessments found</p>
            ) : (
              <div className="space-y-6">
                {assessments.map((assessment) => (
                  <div key={assessment.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{assessment.purpose}</h3>
                        <p className="text-sm text-gray-600">
                          Legal Basis: {assessment.legalBasis}
                        </p>
                        <p className="text-sm text-gray-600">
                          Assessed by: {assessment.assessedBy}
                        </p>
                        <p className="text-sm text-gray-600">
                          Date: {new Date(assessment.assessmentDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(assessment.riskLevel)}`}>
                          {assessment.riskLevel} Risk
                        </span>
                        {assessment.approvedBy && (
                          <p className="text-xs text-gray-500 mt-1">
                            Approved by: {assessment.approvedBy}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Data Categories:</h4>
                      <div className="flex flex-wrap gap-2">
                        {assessment.dataCategories.map((category, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Mitigation Measures:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {assessment.mitigationMeasures.map((measure, index) => (
                          <li key={index}>{measure}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View Details
                      </button>
                      <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                        Delete
                      </button>
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

