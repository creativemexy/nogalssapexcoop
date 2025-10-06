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

        // Get real analytics data
        const [userRegistrations, cooperativeRegistrations, transactionVolume, loanPerformance, recentUsers, recentTransactions] = await Promise.all([
            // User registrations by month (last 6 months)
            prisma.$queryRaw`
                SELECT 
                    DATE_TRUNC('month', "createdAt") as month,
                    COUNT(*) as count
                FROM "users" 
                WHERE "createdAt" >= NOW() - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', "createdAt")
                ORDER BY month DESC
                LIMIT 6
            `,
            // Cooperative registrations by month
            prisma.$queryRaw`
                SELECT 
                    DATE_TRUNC('month', "createdAt") as month,
                    COUNT(*) as count
                FROM "cooperatives" 
                WHERE "createdAt" >= NOW() - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', "createdAt")
                ORDER BY month DESC
                LIMIT 6
            `,
            // Transaction volume by month
            prisma.$queryRaw`
                SELECT 
                    DATE_TRUNC('month', "createdAt") as month,
                    SUM(amount) as amount
                FROM "transactions" 
                WHERE "createdAt" >= NOW() - INTERVAL '6 months'
                AND status = 'SUCCESSFUL'
                GROUP BY DATE_TRUNC('month', "createdAt")
                ORDER BY month DESC
                LIMIT 6
            `,
            // Loan performance
            prisma.loan.groupBy({
                by: ['status'],
                _count: { id: true }
            }),
            // Recent users
            prisma.user.findMany({
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            }),
            // Recent transactions
            prisma.transaction.findMany({
                select: {
                    amount: true,
                    type: true,
                    status: true,
                    createdAt: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            })
        ]);

        // Get contributions separately and combine with transactions
        const contributions = await prisma.contribution.findMany({
            select: {
                amount: true,
                description: true,
                createdAt: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Combine transactions and contributions
        const combinedTransactions = [
            ...recentTransactions.map(tx => ({ ...tx, source: 'transaction' })),
            ...contributions.map(contrib => ({ 
                ...contrib, 
                source: 'contribution',
                type: 'CONTRIBUTION',
                status: 'SUCCESSFUL' // Contributions are always successful when saved
            }))
        ];
        
        // Sort by creation date and take the most recent 10
        const finalRecentTransactions = combinedTransactions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);

        // Format the data for frontend
        const formattedUserRegistrations = (userRegistrations as any[]).map(item => ({
            month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
            count: Number(item.count)
        }));

        const formattedCooperativeRegistrations = (cooperativeRegistrations as any[]).map(item => ({
            month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
            count: Number(item.count)
        }));

        const formattedTransactionVolume = (transactionVolume as any[]).map(item => ({
            month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
            amount: Number(item.amount) / 100 // Convert from kobo to naira
        }));

        const formattedLoanPerformance = loanPerformance.map(item => ({
            status: item.status,
            count: item._count.id
        }));

        const reportData = {
            totalUsers,
            totalCooperatives,
            totalTransactions,
            totalLoans,
            activeLoans,
            pendingLoans,
            totalPayments: totalPayments,
            userRegistrations: formattedUserRegistrations,
            cooperativeRegistrations: formattedCooperativeRegistrations,
            transactionVolume: formattedTransactionVolume,
            loanPerformance: formattedLoanPerformance,
            recentUsers,
            recentTransactions: finalRecentTransactions.map(tx => ({
                ...tx,
                amount: Number(tx.amount) / 100, // Convert from kobo to naira
                type: tx.source === 'contribution' ? 'CONTRIBUTION' : tx.type,
                source: tx.source
            }))
        };

        return NextResponse.json(reportData);
    } catch (error) {
        console.error('Error fetching report data:', error);
        
        // Return fallback data on error
        return NextResponse.json({
            totalUsers: 0,
            totalCooperatives: 0,
            totalTransactions: 0,
            totalLoans: 0,
            activeLoans: 0,
            pendingLoans: 0,
            totalPayments: 0,
            userRegistrations: [],
            cooperativeRegistrations: [],
            transactionVolume: [],
            loanPerformance: [],
            recentUsers: [],
            recentTransactions: [],
            error: 'Database connection issue - showing fallback data'
        });
    }
} 