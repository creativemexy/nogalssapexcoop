import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ChargeTracker } from '@/lib/charge-tracker';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['FINANCE', 'SUPER_ADMIN'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get comprehensive financial data with fallback
    let adminFees, transactionContributions, directContributions, loans, withdrawals, loanRepayments, recentTransactions, recentContributions, monthlyStats, userStats;
    
    try {
      [
        // Administrative fees (includes registration fees)
        adminFees,
        // Contributions/Savings from Transaction table (excluding admin fees)
        transactionContributions,
        // Contributions from Contribution table (direct contributions)
        directContributions,
        // Loans
        loans,
        // Withdrawals
        withdrawals,
        // Loan repayments
        loanRepayments,
        // Recent transactions
        recentTransactions,
        // Recent contributions
        recentContributions,
        // Monthly breakdown
        monthlyStats,
        // User counts
        userStats
      ] = await Promise.all([
      // Administrative fees (includes registration fees and other admin charges)
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          status: 'SUCCESSFUL',
          type: 'FEE'
        }
      }),
      // Contributions/Savings from Transaction table (member contributions, excluding admin fees and loan repayments)
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          status: 'SUCCESSFUL',
          type: 'CONTRIBUTION',
          amount: { gt: 0 },
          AND: [
            { description: { not: { contains: 'registration' } } },
            { description: { not: { contains: 'repayment' } } }
          ]
        }
      }),
      // Direct contributions from Contribution table (leaders and cooperative members)
      prisma.contribution.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          isActive: true
        }
      }),
      // Loans
      prisma.loan.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: { status: { in: ['APPROVED', 'ACTIVE'] } }
      }),
      // Withdrawals
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          status: 'SUCCESSFUL',
          type: 'WITHDRAWAL'
        }
      }),
      // Loan repayments (tracked as contributions with loan repayment description)
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          status: 'SUCCESSFUL',
          type: 'CONTRIBUTION',
          description: { contains: 'repayment' }
        }
      }),
      // Recent transactions - fetch ALL transactions regardless of status
      prisma.transaction.findMany({
        where: {
          // Include all transaction types and statuses for comprehensive view
          OR: [
            { status: 'SUCCESSFUL' },
            { status: 'PENDING' },
            { status: 'FAILED' },
            { status: 'CANCELLED' }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 20, // Increased from 10 to show more transactions
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      }),
      // Recent contributions from Contribution table (leaders and cooperative members)
      prisma.contribution.findMany({
        where: {
          isActive: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20, // Get recent contributions
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      }),
      // Monthly stats for the last 6 months - use raw query to group by month
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          SUM(amount) as total_amount,
          COUNT(id) as transaction_count
        FROM "transactions" 
        WHERE status = 'SUCCESSFUL' 
          AND "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `,
        // User statistics
        prisma.user.groupBy({
          by: ['role'],
          _count: { id: true }
        })
      ]);
    } catch (dbError) {
      console.error('Database connection error, using fallback data:', dbError);
      
      // Fallback data when database is unavailable
      adminFees = { _sum: { amount: 0 }, _count: { id: 0 } };
      transactionContributions = { _sum: { amount: 0 }, _count: { id: 0 } };
      directContributions = { _sum: { amount: 0 }, _count: { id: 0 } };
      loans = { _sum: { amount: 0 }, _count: { id: 0 } };
      withdrawals = { _sum: { amount: 0 }, _count: { id: 0 } };
      loanRepayments = { _sum: { amount: 0 }, _count: { id: 0 } };
      recentTransactions = [];
      recentContributions = [];
      monthlyStats = [];
      userStats = [];
    }

    // Calculate totals (convert from kobo to naira)
    const totalAdminFees = Number(adminFees._sum.amount || 0) / 100;
    const totalTransactionContributions = Number(transactionContributions._sum.amount || 0) / 100;
    const totalDirectContributions = Number(directContributions._sum.amount || 0) / 100;
    const totalContributions = totalTransactionContributions + totalDirectContributions;
    const totalLoans = Number(loans._sum.amount || 0) / 100;
    const totalWithdrawals = Number(withdrawals._sum.amount || 0) / 100;
    const totalLoanRepayments = Number(loanRepayments._sum.amount || 0) / 100;

    // Calculate net balance
    const totalInflow = totalAdminFees + totalContributions + totalLoanRepayments;
    const totalOutflow = totalLoans + totalWithdrawals;
    const netBalance = totalInflow - totalOutflow;

    // Format recent transactions (convert from kobo to naira)
    const formattedTransactions = recentTransactions.map(t => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount) / 100,
      description: t.description,
      date: t.createdAt.toISOString(),
      user: t.user ? `${t.user.firstName} ${t.user.lastName}` : 'Unknown User',
      status: t.status
    }));

    // Format recent contributions (convert from kobo to naira)
    const formattedContributions = recentContributions.map(c => ({
      id: c.id,
      type: 'CONTRIBUTION',
      amount: Number(c.amount) / 100,
      description: c.description || 'Direct Contribution',
      date: c.createdAt.toISOString(),
      user: c.user ? `${c.user.firstName} ${c.user.lastName}` : 'Unknown User',
      status: 'SUCCESSFUL' // Contributions are always successful
    }));

    // Combine and sort all recent activity by date
    const allRecentActivity = [...formattedTransactions, ...formattedContributions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20); // Take the 20 most recent

    // Format monthly stats (convert from kobo to naira)
    const monthlyBreakdown = (monthlyStats as any[]).map(stat => ({
      month: new Date(stat.month).toISOString().substring(0, 7),
      amount: Number(stat.total_amount || 0) / 100,
      count: Number(stat.transaction_count || 0)
    }));

    // Format user stats
    const userBreakdown = userStats.map(stat => ({
      role: stat.role,
      count: stat._count.id
    }));

    // Get charge tracking data
    const chargeTracking = await ChargeTracker.getSystemChargeStats();

    return NextResponse.json({
      // Main financial metrics
      totalInflow,
      totalOutflow,
      netBalance,
      
      // Detailed breakdown
      adminFees: {
        amount: totalAdminFees,
        count: adminFees._count.id
      },
      contributions: {
        amount: totalContributions,
        count: transactionContributions._count.id + directContributions._count.id
      },
      loans: {
        amount: totalLoans,
        count: loans._count.id
      },
      withdrawals: {
        amount: totalWithdrawals,
        count: withdrawals._count.id
      },
      loanRepayments: {
        amount: totalLoanRepayments,
        count: loanRepayments._count.id
      },
      
      // Recent activity (combined transactions and contributions)
      recentTransactions: allRecentActivity,
      monthlyBreakdown,
      userBreakdown,
      
      // Charge tracking data
      chargeTracking: {
        totalCharges: chargeTracking.totalCharges,
        totalBaseAmount: chargeTracking.totalBaseAmount,
        chargeCount: chargeTracking.chargeCount,
        averageChargePercentage: chargeTracking.averageChargePercentage,
        chargesByType: chargeTracking.chargesByType
      },
      
      // Database status
      databaseStatus: allRecentActivity.length > 0 ? 'connected' : 'fallback'
    });
  } catch (error) {
    console.error('Finance dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}







