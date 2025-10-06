'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Log } from '@prisma/client';

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

interface LogsResponse {
    logs: Log[];
    pagination: PaginationInfo;
}

export default function LogsPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchLogs = async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/logs?page=${page}&limit=20`);
            if (!response.ok) {
                throw new Error('Failed to fetch logs');
            }
            const data: LogsResponse = await response.json();
            setLogs(data.logs);
            setPagination(data.pagination);
            setCurrentPage(page);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, []);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= (pagination?.totalPages || 1)) {
            fetchLogs(page);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">User Activity Logs</h1>
                <Link href="/dashboard/super-admin" className="text-blue-600 hover:text-blue-500">
                    &larr; Back to Dashboard
                </Link>
            </div>
            
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="text-lg text-gray-600">Loading logs...</div>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.userEmail}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-700">
                                <span>
                                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
                                    {pagination.totalCount} results
                                </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                {/* Previous Button */}
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={!pagination.hasPrevPage}
                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                {/* Page Numbers */}
                                <div className="flex space-x-1">
                                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (pagination.totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (pagination.currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                            pageNum = pagination.totalPages - 4 + i;
                                        } else {
                                            pageNum = pagination.currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`px-3 py-2 text-sm font-medium rounded-md ${
                                                    pageNum === pagination.currentPage
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Next Button */}
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={!pagination.hasNextPage}
                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
} 