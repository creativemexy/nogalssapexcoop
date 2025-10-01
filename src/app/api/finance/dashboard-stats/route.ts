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

    // Get comprehensive financial data
    const [
      // Administrative fees (includes registration fees)
      adminFees,
      // Contributions/Savings (excluding admin fees)
      contributions,
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
      // Contributions/Savings (member contributions, excluding admin fees and loan repayments)
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

    // Calculate totals
    const totalAdminFees = Number(adminFees._sum.amount || 0);
    const totalContributions = Number(contributions._sum.amount || 0);
    const totalLoans = Number(loans._sum.amount || 0);
    const totalWithdrawals = Number(withdrawals._sum.amount || 0);
    const totalLoanRepayments = Number(loanRepayments._sum.amount || 0);

    // Calculate net balance
    const totalInflow = totalAdminFees + totalContributions + totalLoanRepayments;
    const totalOutflow = totalLoans + totalWithdrawals;
    const netBalance = totalInflow - totalOutflow;

    // Format recent transactions
    const formattedTransactions = recentTransactions.map(t => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      description: t.description,
      date: t.createdAt.toISOString(),
      user: t.user ? `${t.user.firstName} ${t.user.lastName}` : 'Unknown User'
    }));

    // Format monthly stats
    const monthlyBreakdown = monthlyStats.map(stat => ({
      month: stat.createdAt.toISOString().substring(0, 7),
      amount: Number(stat._sum.amount || 0),
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
        count: contributions._count.id
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
      userBreakdown
    });
  } catch (error) {
    console.error('Finance dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}







