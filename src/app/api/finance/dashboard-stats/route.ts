import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['FINANCE', 'SUPER_ADMIN'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get comprehensive financial data with fallback
    let adminFees, transactionContributions, directContributions, loans, withdrawals, loanRepayments, recentTransactions, monthlyStats, userStats;
    
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
      // Recent transactions
      prisma.transaction.findMany({
        where: { status: 'SUCCESSFUL' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      }),
      // Monthly stats for the last 6 months
      prisma.transaction.groupBy({
        by: ['createdAt'],
        _sum: { amount: true },
        _count: { id: true },
        where: {
          status: 'SUCCESSFUL',
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
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
      user: t.user ? `${t.user.firstName} ${t.user.lastName}` : 'Unknown User'
    }));

    // Format monthly stats (convert from kobo to naira)
    const monthlyBreakdown = monthlyStats.map(stat => ({
      month: stat.createdAt.toISOString().substring(0, 7),
      amount: Number(stat._sum.amount || 0) / 100,
      count: stat._count.id
    }));

    // Format user stats
    const userBreakdown = userStats.map(stat => ({
      role: stat.role,
      count: stat._count.id
    }));

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
      
      // Recent activity
      recentTransactions: formattedTransactions,
      monthlyBreakdown,
      userBreakdown,
      
      // Database status
      databaseStatus: recentTransactions.length > 0 ? 'connected' : 'fallback'
    });
  } catch (error) {
    console.error('Finance dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}







