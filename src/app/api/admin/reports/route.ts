import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '30';
        const days = parseInt(range);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch basic statistics
        const [
            totalUsers,
            totalCooperatives,
            totalTransactions,
            totalLoans,
            activeLoans,
            pendingLoans,
            totalPayments
        ] = await Promise.all([
            prisma.user.count(),
            prisma.cooperative.count(),
            prisma.transaction.count(),
            prisma.loan.count(),
            prisma.loan.count({ where: { status: 'ACTIVE' } }),
            prisma.loan.count({ where: { status: 'PENDING' } }),
            prisma.payment.count()
        ]);

        // Generate mock data for charts (in a real app, this would be actual data)
        const userRegistrations = Array.from({ length: 6 }, (_, i) => ({
            month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
            count: Math.floor(Math.random() * 50) + 10
        }));

        const cooperativeRegistrations = Array.from({ length: 6 }, (_, i) => ({
            month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
            count: Math.floor(Math.random() * 10) + 1
        }));

        const transactionVolume = Array.from({ length: 6 }, (_, i) => ({
            month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
            amount: Math.floor(Math.random() * 10000000) + 1000000
        }));

        const loanPerformance = [
            { status: 'Active', count: activeLoans },
            { status: 'Pending', count: pendingLoans },
            { status: 'Completed', count: Math.floor(totalLoans * 0.3) },
            { status: 'Defaulted', count: Math.floor(totalLoans * 0.05) }
        ];

        const reportData = {
            totalUsers,
            totalCooperatives,
            totalTransactions,
            totalLoans,
            activeLoans,
            pendingLoans,
            totalPayments: totalPayments * 25000, // Mock total amount
            monthlyGrowth: 15.5, // Mock growth percentage
            userRegistrations,
            cooperativeRegistrations,
            transactionVolume,
            loanPerformance
        };

        return NextResponse.json(reportData);
    } catch (error) {
        console.error('Error fetching report data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 