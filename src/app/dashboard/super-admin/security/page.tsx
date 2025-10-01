'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SecurityAudit {
  passed: boolean;
  warnings: string[];
  errors: string[];
  score: number;
}

interface SecurityConfig {
  email: {
    isProductionEmail: boolean;
    isSecureConnection: boolean;
    hasValidCredentials: boolean;
    fromAddress: string;
  };
  encryption: {
    hasCustomKey: boolean;
    hasCustomIV: boolean;
    keyLength: number;
    ivLength: number;
  };
  database: {
    isSecureConnection: boolean;
    hasCredentials: boolean;
  };
  payment: {
    isProductionKeys: boolean;
    hasSecretKey: boolean;
    hasPublicKey: boolean;
  };
  application: {
    isProduction: boolean;
    isDevelopment: boolean;
    hasValidNextAuthSecret: boolean;
    hasValidNextAuthUrl: boolean;
  };
}

export default function SecurityDashboard() {
  const [audit, setAudit] = useState<SecurityAudit | null>(null);
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [auditRes, configRes, recommendationsRes] = await Promise.all([
        fetch('/api/admin/security/audit'),
        fetch('/api/admin/security/config'),
        fetch('/api/admin/security/recommendations'),
      ]);

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAudit(auditData);
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
      }

      if (recommendationsRes.ok) {
        const recommendationsData = await recommendationsRes.json();
        setRecommendations(recommendationsData);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading security dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
        <Link href="/dashboard/super-admin" className="text-green-600 hover:text-green-500 underline">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Security Score */}
      {audit && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Security Score</h2>
              <p className="text-sm text-gray-600">Overall security assessment</p>
            </div>
            <div className={`px-4 py-2 rounded-full ${getScoreBgColor(audit.score)}`}>
              <span className={`text-2xl font-bold ${getScoreColor(audit.score)}`}>
                {audit.score}/100
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  audit.score >= 90 ? 'bg-green-600' : 
                  audit.score >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${audit.score}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Security Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Email Security */}
        {config && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">Email Security</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Production Email:</span>
                <span className={`text-sm font-medium ${config.email.isProductionEmail ? 'text-green-600' : 'text-red-600'}`}>
                  {config.email.isProductionEmail ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Secure Connection:</span>
                <span className={`text-sm font-medium ${config.email.isSecureConnection ? 'text-green-600' : 'text-red-600'}`}>
                  {config.email.isSecureConnection ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Valid Credentials:</span>
                <span className={`text-sm font-medium ${config.email.hasValidCredentials ? 'text-green-600' : 'text-red-600'}`}>
                  {config.email.hasValidCredentials ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Encryption Security */}
        {config && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">Encryption</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Custom Key:</span>
                <span className={`text-sm font-medium ${config.encryption.hasCustomKey ? 'text-green-600' : 'text-red-600'}`}>
                  {config.encryption.hasCustomKey ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Custom IV:</span>
                <span className={`text-sm font-medium ${config.encryption.hasCustomIV ? 'text-green-600' : 'text-red-600'}`}>
                  {config.encryption.hasCustomIV ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Key Length:</span>
                <span className="text-sm font-medium text-gray-900">{config.encryption.keyLength} chars</span>
              </div>
            </div>
          </div>
        )}

        {/* Application Security */}
        {config && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">Application</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Environment:</span>
                <span className={`text-sm font-medium ${config.application.isProduction ? 'text-blue-600' : 'text-yellow-600'}`}>
                  {config.application.isProduction ? 'Production' : 'Development'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">NextAuth Secret:</span>
                <span className={`text-sm font-medium ${config.application.hasValidNextAuthSecret ? 'text-green-600' : 'text-red-600'}`}>
                  {config.application.hasValidNextAuthSecret ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Valid URL:</span>
                <span className={`text-sm font-medium ${config.application.hasValidNextAuthUrl ? 'text-green-600' : 'text-red-600'}`}>
                  {config.application.hasValidNextAuthUrl ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Issues */}
      {audit && (audit.errors.length > 0 || audit.warnings.length > 0) && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Issues</h2>
          
          {audit.errors.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-medium text-red-600 mb-2">Errors ({audit.errors.length})</h3>
              <ul className="space-y-1">
                {audit.errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-600 flex items-start">
                    <span className="mr-2">•</span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {audit.warnings.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-yellow-600 mb-2">Warnings ({audit.warnings.length})</h3>
              <ul className="space-y-1">
                {audit.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-600 flex items-start">
                    <span className="mr-2">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Recommendations</h2>
          <ul className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start">
                <span className="mr-2">•</span>
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

