'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function CooperativeDashboard() {
    const { data: session } = useSession();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Co-operative Dashboard</h1>
            <div className="bg-white rounded-lg shadow p-8">
                <p className="text-gray-600">Welcome to your Co-operative Dashboard.</p>
                <p className="mt-4 text-gray-600">This page will display information relevant to the entire co-operative, such as total contributions, active loans, and recent activity.</p>
                 <div className="mt-6">
                    <Link href="/dashboard/cooperative/transactions" className="text-blue-600 hover:text-blue-500">
                        View Transactions
                    </Link>
                </div>
            </div>
        </div>
    );
} 