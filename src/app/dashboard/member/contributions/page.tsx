'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Contribution {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
  cooperative: {
    id: string;
    name: string;
    registrationNumber: string;
    logo?: string | null;
  };
}

interface ContributionStats {
  totalContributions: number;
  totalAmount: number;
  averageAmount: number;
  thisMonthContributions: number;
  thisMonthAmount: number;
}

export default function MemberContributionsPage() {
  const { data: session } = useSession();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [stats, setStats] = useState<ContributionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const fetchContributions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/member/contributions');
      const data = await response.json();
      
      if (response.ok) {
        setContributions(data.contributions || []);
        setStats(data.stats || null);
        setLastUpdated(new Date());
      } else {
        setError(data.error || 'Failed to fetch contributions');
      }
    } catch (err) {
      setError('Network error - unable to fetch contributions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateForReceipt = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadReceipt = (contribution: Contribution) => {
    setSelectedContribution(contribution);
    setShowReceipt(true);
  };

  const generatePDF = () => {
    // Wait for modal to render, then trigger print (which can save as PDF)
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const downloadAsHTML = () => {
    if (!selectedContribution || !receiptRef.current) return;

    // Helper function to get full logo URL
    const getLogoUrl = (logo: string | null | undefined) => {
      if (!logo) return `${window.location.origin}/logo.png`;
      if (logo.startsWith('http://') || logo.startsWith('https://')) {
        return logo;
      }
      // If it's a relative path, make it absolute
      if (logo.startsWith('/')) {
        return `${window.location.origin}${logo}`;
      }
      return logo;
    };

    const logoUrl = getLogoUrl(selectedContribution.cooperative.logo);

    // Create a downloadable HTML file
    const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contribution Receipt - ${selectedContribution.id.slice(-8)}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header img {
      max-height: 80px;
      max-width: 200px;
      margin: 0 auto 20px;
      display: block;
      object-fit: contain;
    }
    .header h1 {
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 5px 0;
    }
    .header p {
      font-size: 14px;
      color: #666;
      margin: 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .detail-label {
      color: #666;
      font-weight: normal;
    }
    .detail-value {
      font-weight: bold;
      text-align: right;
    }
    .section {
      margin: 20px 0;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }
    .amount-section {
      border-top: 2px solid #333;
      padding-top: 20px;
      margin-top: 30px;
    }
    .amount-value {
      font-size: 24px;
      color: #059669;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #333;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoUrl}" alt="${selectedContribution.cooperative.name} Logo" style="max-height: 80px; max-width: 200px; margin: 0 auto 20px; display: block; object-fit: contain;" />
    <h1>${selectedContribution.cooperative.name}</h1>
    <p>Contribution Receipt</p>
  </div>
  
  <div class="detail-row">
    <span class="detail-label">Receipt Number:</span>
    <span class="detail-value">${selectedContribution.id.slice(-8).toUpperCase()}</span>
  </div>
  
  <div class="detail-row">
    <span class="detail-label">Date:</span>
    <span class="detail-value">${formatDateForReceipt(selectedContribution.createdAt)}</span>
  </div>
  
  <div class="section">
    <div class="detail-row">
      <span class="detail-label">Member Name:</span>
      <span class="detail-value">${session?.user?.name || 'N/A'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Email:</span>
      <span class="detail-value">${session?.user?.email || 'N/A'}</span>
    </div>
  </div>
  
  <div class="section">
    <div class="detail-row">
      <span class="detail-label">Cooperative:</span>
      <span class="detail-value">${selectedContribution.cooperative.name}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Registration Number:</span>
      <span class="detail-value">${selectedContribution.cooperative.registrationNumber}</span>
    </div>
  </div>
  
  <div class="section">
    <div class="detail-row">
      <span class="detail-label">Description:</span>
      <span class="detail-value">${selectedContribution.description || 'Member Contribution'}</span>
    </div>
  </div>
  
  <div class="amount-section">
    <div class="detail-row">
      <span class="detail-label" style="font-size: 18px;">Amount Paid:</span>
      <span class="detail-value amount-value">${formatCurrency(selectedContribution.amount)}</span>
    </div>
  </div>
  
  <div class="footer">
    <p>Thank you for your contribution!</p>
    <p>This is a computer-generated receipt. No signature required.</p>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;

    // Create blob and download
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contribution_receipt_${selectedContribution.id.slice(-8)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setSelectedContribution(null);
  };

  // Filter contributions based on search term and date
  const filteredContributions = contributions.filter(contribution => {
    const matchesSearch = 
      contribution.cooperative.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contribution.cooperative.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contribution.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const contributionDate = new Date(contribution.createdAt);
    const now = new Date();
    const matchesDate = (() => {
      switch (dateFilter) {
        case 'today':
          return contributionDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return contributionDate >= weekAgo;
        case 'month':
          return contributionDate.getMonth() === now.getMonth() && 
                 contributionDate.getFullYear() === now.getFullYear();
        case 'year':
          return contributionDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesDate;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contributions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Contributions</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchContributions}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Link href="/dashboard/member" className="hover:text-gray-700">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900">My Contributions</span>
        </nav>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Contributions</h1>
            <p className="mt-2 text-gray-600">
              View and track all your contributions to your cooperative
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <button
              onClick={fetchContributions}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Contributions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContributions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.thisMonthAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Contributions
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by cooperative name, registration number, or description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <div>
            <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Date
            </label>
            <select
              id="dateFilter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contributions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            My Contributions ({filteredContributions.length})
          </h3>
        </div>
        
        {filteredContributions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Contributions Found</h3>
            <p className="text-gray-600">
              {searchTerm || dateFilter !== 'all' 
                ? 'No contributions match your current search criteria.' 
                : 'You haven\'t made any contributions yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cooperative
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContributions.map((contribution) => (
                  <tr key={contribution.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-green-800">
                              {contribution.cooperative.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {contribution.cooperative.name}
                          </div>
                          <div className="text-sm text-gray-500">{contribution.cooperative.registrationNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(contribution.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{contribution.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(contribution.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDownloadReceipt(contribution)}
                        className="text-green-600 hover:text-green-900 flex items-center gap-1"
                        title="Download Receipt"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Last Updated */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleString()}
      </div>

      {/* Receipt Modal */}
      {showReceipt && selectedContribution && (
        <>
          {/* Receipt Styles */}
          <style dangerouslySetInnerHTML={{__html: `
            .receipt-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.5);
              z-index: 50;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .receipt-container {
              background: white;
              max-width: 600px;
              width: 90%;
              max-height: 90vh;
              overflow-y: auto;
              border-radius: 8px;
              padding: 24px;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            }
            .receipt-container.hidden {
              position: absolute;
              left: -9999px;
              top: -9999px;
            }
            @media print {
              body * {
                visibility: hidden;
              }
              .receipt-container, .receipt-container * {
                visibility: visible;
              }
              .receipt-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 20px;
                box-shadow: none;
              }
              .receipt-overlay {
                background: white;
                position: fixed;
                inset: 0;
              }
            }
          `}} />

          {/* Overlay */}
          <div className="receipt-overlay" onClick={handleCloseReceipt}>
            <div className={`receipt-container ${showReceipt ? '' : 'hidden'}`} onClick={(e) => e.stopPropagation()} ref={receiptRef}>
              {/* Receipt Header */}
              <div className="text-center mb-6 pb-4 border-b-2 border-gray-300">
                <div className="mb-4 flex justify-center">
                  <img 
                    src={
                      selectedContribution.cooperative.logo 
                        ? (selectedContribution.cooperative.logo.startsWith('http') 
                            ? selectedContribution.cooperative.logo 
                            : selectedContribution.cooperative.logo.startsWith('/')
                            ? selectedContribution.cooperative.logo
                            : `/${selectedContribution.cooperative.logo}`)
                        : '/logo.png'
                    } 
                    alt={`${selectedContribution.cooperative.name} Logo`}
                    className="h-20 w-auto object-contain max-w-[200px]"
                    onError={(e) => {
                      // Fallback to default logo if image fails to load
                      e.currentTarget.src = '/logo.png';
                    }}
                  />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">{selectedContribution.cooperative.name}</div>
                <div className="text-sm text-gray-600">Contribution Receipt</div>
              </div>

              {/* Receipt Details */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Receipt Number:</span>
                  <span className="font-semibold">{selectedContribution.id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-semibold">{formatDateForReceipt(selectedContribution.createdAt)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="mb-2">
                    <span className="text-gray-600">Member Name:</span>
                    <div className="font-semibold text-lg">{session?.user?.name || 'N/A'}</div>
                  </div>
                  <div className="mb-2">
                    <span className="text-gray-600">Email:</span>
                    <div className="font-semibold">{session?.user?.email || 'N/A'}</div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="mb-2">
                    <span className="text-gray-600">Cooperative:</span>
                    <div className="font-semibold text-lg">{selectedContribution.cooperative.name}</div>
                  </div>
                  <div className="mb-2">
                    <span className="text-gray-600">Registration Number:</span>
                    <div className="font-semibold">{selectedContribution.cooperative.registrationNumber}</div>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="mb-2">
                    <span className="text-gray-600">Description:</span>
                    <div className="font-semibold">{selectedContribution.description || 'Member Contribution'}</div>
                  </div>
                </div>
                <div className="border-t-2 border-gray-300 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Amount Paid:</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(selectedContribution.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="border-t-2 border-gray-300 pt-4 mt-6 text-center">
                <div className="text-sm text-gray-600 mb-2">
                  Thank you for your contribution!
                </div>
                <div className="text-xs text-gray-500">
                  This is a computer-generated receipt. No signature required.
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Generated on {new Date().toLocaleString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-4">
                <button
                  onClick={generatePDF}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save as PDF
                </button>
                <button
                  onClick={downloadAsHTML}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download HTML
                </button>
                <button
                  onClick={handleCloseReceipt}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
