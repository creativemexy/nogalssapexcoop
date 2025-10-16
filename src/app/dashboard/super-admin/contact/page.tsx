'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  parentOrganizationId?: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  parentOrganization?: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ContactMessagesResponse {
  messages: ContactMessage[];
  supportTickets: SupportTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  statusStats: {
    UNREAD: number;
    READ: number;
    REPLIED: number;
    ARCHIVED: number;
  };
  supportStats: {
    OPEN: number;
    IN_PROGRESS: number;
    RESOLVED: number;
    CLOSED: number;
  };
}

export default function ContactMessagesPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [statusStats, setStatusStats] = useState<any>(null);
  const [supportStats, setSupportStats] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [usingFileBackup, setUsingFileBackup] = useState(false);
  const [activeTab, setActiveTab] = useState<'messages' | 'tickets'>('messages');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try database first
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/contact-messages?${params}`);
      
      if (response.ok) {
        const data: ContactMessagesResponse = await response.json();
        setMessages(data.messages);
        setSupportTickets(data.supportTickets || []);
        setPagination(data.pagination);
        setStatusStats(data.statusStats);
        setSupportStats(data.supportStats);
        setUsingFileBackup(false);
      } else {
        // If database fails, try file-based backup
        console.log('Database unavailable, trying file-based messages...');
        const fileResponse = await fetch('/api/admin/contact-messages-file');
        
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          // Convert file messages to the expected format
          const formattedMessages = fileData.messages.map((msg: any) => ({
            id: `file-${msg.timestamp}`,
            name: msg.name,
            email: msg.email,
            phone: msg.phone,
            subject: msg.subject,
            message: msg.message,
            status: 'UNREAD',
            createdAt: msg.timestamp,
            updatedAt: msg.timestamp
          }));
          
          setMessages(formattedMessages);
          setPagination({
            page: 1,
            limit: 10,
            total: formattedMessages.length,
            pages: 1,
            hasNext: false,
            hasPrev: false
          });
          setStatusStats({
            UNREAD: formattedMessages.length,
            READ: 0,
            REPLIED: 0,
            ARCHIVED: 0
          });
          setUsingFileBackup(true);
        } else {
          setError('Failed to fetch contact messages from both database and file backup');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contact messages');
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/admin/contact-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        fetchMessages(); // Refresh the list
        if (selectedMessage?.id === id) {
          setSelectedMessage({ ...selectedMessage, status });
        }
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(`/api/admin/contact-messages?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMessages(); // Refresh the list
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const updateTicketStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/admin/support-tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        fetchMessages(); // Refresh the list
        if (selectedTicket?.id === id) {
          setSelectedTicket({ ...selectedTicket, status });
        }
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const sendReply = async (type: 'message' | 'ticket', id: string, reply: string) => {
    setSendingReply(true);
    try {
      const response = await fetch('/api/admin/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, reply }),
      });

      if (response.ok) {
        setReplyText('');
        alert('Reply sent successfully!');
        fetchMessages(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to send reply: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UNREAD': return 'bg-red-100 text-red-800';
      case 'READ': return 'bg-yellow-100 text-yellow-800';
      case 'REPLIED': return 'bg-green-100 text-green-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin h-10 w-10 border-b-2 border-green-600 rounded-full"></div>
      </div>
    );
  }

  if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contact Messages</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Manage and respond to contact form submissions</p>
          </div>
          <Link href="/dashboard/super-admin">
            <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition">
              Back to Dashboard
            </button>
          </Link>
        </div>
        
        {usingFileBackup && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Database Unavailable</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Contact messages are being displayed from file backup. Database connection will be restored soon.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'messages'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Contact Messages ({statusStats ? (Object.values(statusStats) as number[]).reduce((a: number, b: number) => a + b, 0) : 0})
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tickets'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Support Tickets ({supportStats ? (Object.values(supportStats) as number[]).reduce((a: number, b: number) => a + b, 0) : 0})
            </button>
          </nav>
        </div>
      </div>

      {/* Status Stats */}
      {activeTab === 'messages' && statusStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Unread</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{statusStats.UNREAD}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Read</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{statusStats.READ}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Replied</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{statusStats.REPLIED}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Archived</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{statusStats.ARCHIVED}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Ticket Stats */}
      {activeTab === 'tickets' && supportStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Open</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{supportStats.OPEN}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{supportStats.IN_PROGRESS}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Resolved</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{supportStats.RESOLVED}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Closed</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{supportStats.CLOSED}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
              <option value="REPLIED">Replied</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Messages</h2>
            </div>
            
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin h-8 w-8 border-b-2 border-green-600 rounded-full mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Loading messages...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-600">{error}</p>
                <button 
                  onClick={fetchMessages}
                  className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Retry
                </button>
              </div>
            ) : (activeTab === 'messages' ? messages.length === 0 : supportTickets.length === 0) ? (
              <div className="p-6 text-center">
                <p className="text-gray-600 dark:text-gray-300">No {activeTab === 'messages' ? 'messages' : 'tickets'} found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {activeTab === 'messages' ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                        selectedMessage?.id === message.id ? 'bg-green-50 dark:bg-green-900/20' : ''
                      }`}
                      onClick={() => {
                        setSelectedMessage(message);
                        setSelectedTicket(null);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{message.name}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(message.status)}`}>
                              {message.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{message.email}</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">{message.subject}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{message.message}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(message.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  supportTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                        selectedTicket?.id === ticket.id ? 'bg-green-50 dark:bg-green-900/20' : ''
                      }`}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setSelectedMessage(null);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{ticket.subject}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTicketStatusColor(ticket.status)}`}>
                              {ticket.status}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                            {ticket.user.firstName} {ticket.user.lastName} ({ticket.user.email})
                          </p>
                          {ticket.parentOrganization && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                              Organization: {ticket.parentOrganization.name}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{ticket.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(ticket.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} messages
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message/Ticket Details */}
        <div className="lg:col-span-1">
          {selectedMessage ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Message Details</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedMessage.status)}`}>
                    {selectedMessage.status}
                  </span>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Name</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedMessage.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Email</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedMessage.email}</p>
                </div>
                
                {selectedMessage.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Phone</label>
                    <p className="text-gray-900 dark:text-gray-100">{selectedMessage.phone}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Subject</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedMessage.subject}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Message</label>
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Received</label>
                  <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedMessage.createdAt)}</p>
                </div>
              </div>
              
              {/* Reply Section */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">Send Reply</h4>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                />
                <button
                  onClick={() => sendReply('message', selectedMessage.id, replyText)}
                  disabled={!replyText.trim() || sendingReply}
                  className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {sendingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateMessageStatus(selectedMessage.id, 'READ')}
                    disabled={selectedMessage.status === 'READ'}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Mark as Read
                  </button>
                  <button
                    onClick={() => updateMessageStatus(selectedMessage.id, 'REPLIED')}
                    disabled={selectedMessage.status === 'REPLIED'}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Mark as Replied
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateMessageStatus(selectedMessage.id, 'ARCHIVED')}
                    disabled={selectedMessage.status === 'ARCHIVED'}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ) : selectedTicket ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ticket Details</h3>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTicketStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Subject</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedTicket.subject}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">User</label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {selectedTicket.user.firstName} {selectedTicket.user.lastName} ({selectedTicket.user.email})
                  </p>
                </div>
                
                {selectedTicket.parentOrganization && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Organization</label>
                    <p className="text-gray-900 dark:text-gray-100">{selectedTicket.parentOrganization.name}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Category</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedTicket.category}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Description</label>
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Created</label>
                  <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedTicket.createdAt)}</p>
                </div>
              </div>
              
              {/* Reply Section */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">Send Reply</h4>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                />
                <button
                  onClick={() => sendReply('ticket', selectedTicket.id, replyText)}
                  disabled={!replyText.trim() || sendingReply}
                  className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {sendingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, 'IN_PROGRESS')}
                    disabled={selectedTicket.status === 'IN_PROGRESS'}
                    className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Mark In Progress
                  </button>
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, 'RESOLVED')}
                    disabled={selectedTicket.status === 'RESOLVED'}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Mark Resolved
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, 'CLOSED')}
                    disabled={selectedTicket.status === 'CLOSED'}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Close Ticket
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">Select a {activeTab === 'messages' ? 'message' : 'ticket'} to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
