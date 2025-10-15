'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ComplianceStats {
  totalDataSubjects: number;
  activeConsents: number;
  dataBreaches: number;
  retentionPolicies: number;
  auditLogs: number;
  dataSubjectRequests: number;
}

interface DataBreach {
  id: string;
  description: string;
  categories: string[];
  approximateDataSubjects: number;
  status: string;
  reportedAt: string;
}

interface ConsentStats {
  totalConsents: number;
  activeConsents: number;
  withdrawnConsents: number;
  consentRate: number;
}

export default function PrivacyCompliancePage() {
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [breaches, setBreaches] = useState<DataBreach[]>([]);
  const [consentStats, setConsentStats] = useState<ConsentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      
      // Fetch compliance statistics
      const statsResponse = await fetch('/api/admin/privacy-compliance/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch recent breaches
      const breachesResponse = await fetch('/api/admin/privacy-compliance/breaches');
      const breachesData = await breachesResponse.json();
      setBreaches(breachesData.breaches || []);

      // Fetch consent statistics
      const consentResponse = await fetch('/api/admin/privacy-compliance/consent-stats');
      const consentData = await consentResponse.json();
      setConsentStats(consentData);

    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
    } finally {
      setLoading(false);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Privacy & Compliance Dashboard</h1>
              <p className="mt-2 text-gray-600">
                NDPA Compliance Management and Data Protection Monitoring
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/dashboard/super-admin/privacy-compliance/data-subjects"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Data Subjects
              </Link>
              <Link
                href="/dashboard/super-admin/privacy-compliance/audit-logs"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Audit Logs
              </Link>
            </div>
          </div>
        </div>

        {/* Compliance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Data Subjects</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.totalDataSubjects || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Consents</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.activeConsents || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Data Breaches</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.dataBreaches || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Retention Policies</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.retentionPolicies || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Audit Logs</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.auditLogs || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Data Subject Requests</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.dataSubjectRequests || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Data Breaches */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Data Breaches</h2>
          </div>
          <div className="p-6">
            {breaches.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No data breaches reported</p>
            ) : (
              <div className="space-y-4">
                {breaches.slice(0, 5).map((breach) => (
                  <div key={breach.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{breach.description}</h3>
                        <p className="text-sm text-gray-600">
                          Categories: {breach.categories.join(', ')}
                        </p>
                        <p className="text-sm text-gray-600">
                          Affected: {breach.approximateDataSubjects} data subjects
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          breach.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          breach.status === 'contained' ? 'bg-yellow-100 text-yellow-800' :
                          breach.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {breach.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(breach.reportedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Consent Statistics */}
        {consentStats && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Consent Statistics</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{consentStats.totalConsents}</p>
                  <p className="text-sm text-gray-600">Total Consents</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{consentStats.activeConsents}</p>
                  <p className="text-sm text-gray-600">Active Consents</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{consentStats.withdrawnConsents}</p>
                  <p className="text-sm text-gray-600">Withdrawn Consents</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{consentStats.consentRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Consent Rate</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/dashboard/super-admin/privacy-compliance/retention-policies"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Retention Policies</h3>
                <p className="text-sm text-gray-600">Manage data retention policies</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/super-admin/privacy-compliance/breach-management"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Breach Management</h3>
                <p className="text-sm text-gray-600">Handle data breach incidents</p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/super-admin/privacy-compliance/compliance-reports"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Compliance Reports</h3>
                <p className="text-sm text-gray-600">Generate compliance reports</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

