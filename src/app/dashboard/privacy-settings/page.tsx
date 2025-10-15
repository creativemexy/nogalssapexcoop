'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ConsentRecord {
  id: string;
  purpose: string;
  consentGiven: boolean;
  consentDate: string;
  withdrawalDate?: string;
}

interface DataSubjectRequest {
  id: string;
  requestType: string;
  description: string;
  status: string;
  requestedAt: string;
  completedAt?: string;
}

export default function PrivacySettingsPage() {
  const { data: session } = useSession();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRequest, setNewRequest] = useState({
    requestType: '',
    description: ''
  });

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user consents
      const consentsResponse = await fetch('/api/privacy/consent');
      const consentsData = await consentsResponse.json();
      setConsents(consentsData.consents || []);

      // Fetch user data subject requests
      const requestsResponse = await fetch('/api/privacy/data-subject-rights');
      const requestsData = await requestsResponse.json();
      setRequests(requestsData.requests || []);

    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentWithdrawal = async (purpose: string) => {
    try {
      const response = await fetch('/api/privacy/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'withdraw',
          purpose
        })
      });

      if (response.ok) {
        await fetchUserData(); // Refresh data
        alert('Consent withdrawn successfully');
      } else {
        alert('Failed to withdraw consent');
      }
    } catch (error) {
      console.error('Failed to withdraw consent:', error);
      alert('Failed to withdraw consent');
    }
  };

  const handleDataSubjectRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRequest.requestType || !newRequest.description) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/privacy/data-subject-rights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      });

      if (response.ok) {
        setNewRequest({ requestType: '', description: '' });
        await fetchUserData(); // Refresh data
        alert('Request submitted successfully');
      } else {
        alert('Failed to submit request');
      }
    } catch (error) {
      console.error('Failed to submit request:', error);
      alert('Failed to submit request');
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your data protection preferences and exercise your rights under the Nigeria Data Protection Act
          </p>
        </div>

        {/* Data Subject Rights */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Data Protection Rights</h2>
            <p className="text-sm text-gray-600 mt-1">
              Under the Nigeria Data Protection Act, you have the following rights regarding your personal data:
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Right of Access</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    You can request access to your personal data that we process.
                  </p>
                  <button
                    onClick={() => setNewRequest({ requestType: 'access', description: 'Request access to my personal data' })}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Request Access →
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Right to Rectification</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    You can request correction of inaccurate or incomplete personal data.
                  </p>
                  <button
                    onClick={() => setNewRequest({ requestType: 'rectification', description: 'Request correction of my personal data' })}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Request Correction →
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Right to Erasure</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    You can request deletion of your personal data in certain circumstances.
                  </p>
                  <button
                    onClick={() => setNewRequest({ requestType: 'erasure', description: 'Request deletion of my personal data' })}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Request Deletion →
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Right to Portability</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    You can request your data in a structured, machine-readable format.
                  </p>
                  <button
                    onClick={() => setNewRequest({ requestType: 'portability', description: 'Request my data in portable format' })}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Request Data Portability →
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Right to Object</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    You can object to certain types of processing of your personal data.
                  </p>
                  <button
                    onClick={() => setNewRequest({ requestType: 'objection', description: 'Object to processing of my personal data' })}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Object to Processing →
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Contact DPO</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Contact our Data Protection Officer for privacy-related inquiries.
                  </p>
                  <a
                    href="mailto:privacy@nogalss.org"
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Contact DPO →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Data Subject Request */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Submit Data Subject Request</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleDataSubjectRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Type
                </label>
                <select
                  value={newRequest.requestType}
                  onChange={(e) => setNewRequest({ ...newRequest, requestType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select request type</option>
                  <option value="access">Access to Data</option>
                  <option value="rectification">Data Correction</option>
                  <option value="erasure">Data Deletion</option>
                  <option value="portability">Data Portability</option>
                  <option value="objection">Object to Processing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Please describe your request in detail..."
                  required
                />
              </div>

              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>

        {/* Consent Management */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Consents</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your consent preferences for data processing activities
            </p>
          </div>
          <div className="p-6">
            {consents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No consent records found</p>
            ) : (
              <div className="space-y-4">
                {consents.map((consent) => (
                  <div key={consent.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{consent.purpose}</h3>
                        <p className="text-sm text-gray-600">
                          Consent given: {new Date(consent.consentDate).toLocaleDateString()}
                        </p>
                        {consent.withdrawalDate && (
                          <p className="text-sm text-red-600">
                            Withdrawn: {new Date(consent.withdrawalDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          consent.consentGiven && !consent.withdrawalDate
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {consent.consentGiven && !consent.withdrawalDate ? 'Active' : 'Withdrawn'}
                        </span>
                        {consent.consentGiven && !consent.withdrawalDate && (
                          <button
                            onClick={() => handleConsentWithdrawal(consent.purpose)}
                            className="ml-2 text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Data Subject Requests */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Data Subject Requests</h2>
            <p className="text-sm text-gray-600 mt-1">
              Track the status of your data protection requests
            </p>
          </div>
          <div className="p-6">
            {requests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No requests submitted</p>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 capitalize">
                          {request.requestType.replace('_', ' ')} Request
                        </h3>
                        <p className="text-sm text-gray-600">{request.description}</p>
                        <p className="text-sm text-gray-500">
                          Submitted: {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                        {request.completedAt && (
                          <p className="text-sm text-gray-500">
                            Completed: {new Date(request.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status.replace('_', ' ')}
                        </span>
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

