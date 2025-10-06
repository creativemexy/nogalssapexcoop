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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly'; // daily, weekly, monthly, yearly
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date ranges based on period
    let dateRange: { start: Date; end: Date };
    const now = new Date();
    
    switch (period) {
      case 'daily':
        dateRange = {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        };
        break;
      case 'weekly':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        dateRange = { start: startOfWeek, end: endOfWeek };
        break;
      case 'monthly':
        dateRange = {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        };
        break;
      case 'yearly':
        dateRange = {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31, 23, 59, 59)
        };
        break;
      default:
        dateRange = {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        };
    }

    // Override with custom dates if provided
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    // Try to get comprehensive financial data with fallback
    let adminFees, transactionContributions, directContributions, loanRepayments, loans, withdrawals, expenses, allTransactions, allContributions, userActivity, transactionTrends;
    
    try {
      [
        // Administrative fees
        adminFees,
        // Contributions/Savings from Transaction table
        transactionContributions,
        // Direct contributions from Contribution table
        directContributions,
        // Loan repayments
        loanRepayments,
        // Loans
        loans,
        // Withdrawals
        withdrawals,
        // Expenses
        expenses,
        // All transactions for the period
        allTransactions,
        // All contributions for the period
        allContributions,
        // User activity stats
        userActivity,
        // Transaction trends
        transactionTrends
      ] = await Promise.all([
      // Administrative fees
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          status: 'SUCCESSFUL',
          type: 'FEE',
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        }
      }),
      // Contributions/Savings from Transaction table
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
          ],
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        }
      }),
      // Direct contributions from Contribution table
      prisma.contribution.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          isActive: true,
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        }
      }),
      // Loan repayments
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          status: 'SUCCESSFUL',
          type: 'CONTRIBUTION',
          description: { contains: 'repayment' },
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        }
      }),
      // Loans
      prisma.loan.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: { 
          status: { in: ['APPROVED', 'ACTIVE'] },
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        }
      }),
      // Withdrawals
      prisma.transaction.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          status: 'SUCCESSFUL',
          type: 'WITHDRAWAL',
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        }
      }),
      // Expenses
      prisma.expense.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          status: { in: ['APPROVED', 'PAID'] },
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        }
      }),
      // All transactions for detailed analysis
      prisma.transaction.findMany({
        where: {
          status: 'SUCCESSFUL',
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      // All contributions for detailed analysis
      prisma.contribution.findMany({
        where: {
          isActive: true,
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      // User activity (new registrations, active users)
      prisma.user.count({
        where: {
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        }
      }),
      // Transaction trends by day/week/month
      prisma.transaction.groupBy({
        by: ['createdAt'],
        _sum: { amount: true },
        _count: { id: true },
        where: {
          status: 'SUCCESSFUL',
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        },
        orderBy: { createdAt: 'asc' }
      })
      ]);
    } catch (dbError) {
      console.error('Database connection error in finance reports, using fallback data:', dbError);
      
      // Fallback data when database is unavailable
      adminFees = { _sum: { amount: 0 }, _count: { id: 0 } };
      transactionContributions = { _sum: { amount: 0 }, _count: { id: 0 } };
      directContributions = { _sum: { amount: 0 }, _count: { id: 0 } };
      loanRepayments = { _sum: { amount: 0 }, _count: { id: 0 } };
      loans = { _sum: { amount: 0 }, _count: { id: 0 } };
      withdrawals = { _sum: { amount: 0 }, _count: { id: 0 } };
      expenses = { _sum: { amount: 0 }, _count: { id: 0 } };
      allTransactions = [];
      allContributions = [];
      userActivity = 0;
      transactionTrends = [];
    }

    // Calculate totals (convert from kobo to naira)
    const totalAdminFees = Number(adminFees._sum.amount || 0) / 100;
    const totalTransactionContributions = Number(transactionContributions._sum.amount || 0) / 100;
    const totalDirectContributions = Number(directContributions._sum.amount || 0) / 100;
    const totalContributions = totalTransactionContributions + totalDirectContributions;
    const totalLoanRepayments = Number(loanRepayments._sum.amount || 0) / 100;
    const totalLoans = Number(loans._sum.amount || 0) / 100;
    const totalWithdrawals = Number(withdrawals._sum.amount || 0) / 100;
    const totalExpenses = Number(expenses._sum.amount || 0) / 100;

    // Calculate financial metrics
    const totalInflow = totalAdminFees + totalContributions + totalLoanRepayments;
    const totalOutflow = totalLoans + totalWithdrawals + totalExpenses;
    const netBalance = totalInflow - totalOutflow;

    // Format transactions (convert from kobo to naira)
    const formattedTransactions = allTransactions.map(t => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount) / 100,
      status: t.status,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
      user: t.user ? {
        name: `${t.user.firstName} ${t.user.lastName}`,
        email: t.user.email,
        role: t.user.role
      } : null
    }));

    // Format contributions (convert from kobo to naira)
    const formattedContributions = allContributions.map(c => ({
      id: c.id,
      type: 'CONTRIBUTION',
      amount: Number(c.amount) / 100,
      status: 'SUCCESSFUL', // Contributions are always successful
      description: c.description || 'Direct Contribution',
      createdAt: c.createdAt.toISOString(),
      user: c.user ? {
        name: `${c.user.firstName} ${c.user.lastName}`,
        email: c.user.email,
        role: c.user.role
      } : null
    }));

    // Combine and sort all transactions and contributions by date
    const allFormattedTransactions = [...formattedTransactions, ...formattedContributions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Format trends data (convert from kobo to naira)
    const trends = transactionTrends.map(trend => ({
      date: trend.createdAt.toISOString().split('T')[0],
      amount: Number(trend._sum.amount || 0) / 100,
      count: trend._count.id
    }));

    // Calculate growth metrics (compare with previous period)
    const previousPeriodStart = new Date(dateRange.start);
    const previousPeriodEnd = new Date(dateRange.start);
    const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
    
    switch (period) {
      case 'daily':
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
        break;
      case 'weekly':
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 7);
        break;
      case 'monthly':
        previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
        previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);
        break;
      case 'yearly':
        previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
        previousPeriodEnd.setFullYear(previousPeriodEnd.getFullYear() - 1);
        break;
    }

    // Get previous period data for comparison
    const [prevAdminFees, prevTransactionContributions, prevDirectContributions, prevLoans, prevWithdrawals] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESSFUL',
          type: 'FEE',
          createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd }
        }
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESSFUL',
          type: 'CONTRIBUTION',
          amount: { gt: 0 },
          AND: [
            { description: { not: { contains: 'registration' } } },
            { description: { not: { contains: 'repayment' } } }
          ],
          createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd }
        }
      }),
      prisma.contribution.aggregate({
        _sum: { amount: true },
        where: {
          isActive: true,
          createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd }
        }
      }),
      prisma.loan.aggregate({
        _sum: { amount: true },
        where: { 
          status: { in: ['APPROVED', 'ACTIVE'] },
          createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd }
        }
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESSFUL',
          type: 'WITHDRAWAL',
          createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd }
        }
      })
    ]);

    const prevTotalInflow = (Number(prevAdminFees._sum.amount || 0) + Number(prevTransactionContributions._sum.amount || 0) + Number(prevDirectContributions._sum.amount || 0)) / 100;
    const prevTotalOutflow = (Number(prevLoans._sum.amount || 0) + Number(prevWithdrawals._sum.amount || 0)) / 100;
    const prevNetBalance = prevTotalInflow - prevTotalOutflow;

    // Calculate growth percentages
    const inflowGrowth = prevTotalInflow > 0 ? ((totalInflow - prevTotalInflow) / prevTotalInflow) * 100 : 0;
    const outflowGrowth = prevTotalOutflow > 0 ? ((totalOutflow - prevTotalOutflow) / prevTotalOutflow) * 100 : 0;
    const balanceGrowth = prevNetBalance !== 0 ? ((netBalance - prevNetBalance) / Math.abs(prevNetBalance)) * 100 : 0;

    return NextResponse.json({
      period,
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString()
      },
      
      // Financial summary
      summary: {
        totalInflow,
        totalOutflow,
        netBalance,
        inflowGrowth: Math.round(inflowGrowth * 100) / 100,
        outflowGrowth: Math.round(outflowGrowth * 100) / 100,
        balanceGrowth: Math.round(balanceGrowth * 100) / 100
      },
      
      // Detailed breakdown
      breakdown: {
        adminFees: {
          amount: totalAdminFees,
          count: adminFees._count.id,
          percentage: totalInflow > 0 ? (totalAdminFees / totalInflow) * 100 : 0
        },
        contributions: {
          amount: totalContributions,
          count: transactionContributions._count.id + directContributions._count.id,
          percentage: totalInflow > 0 ? (totalContributions / totalInflow) * 100 : 0
        },
        loanRepayments: {
          amount: totalLoanRepayments,
          count: loanRepayments._count.id,
          percentage: totalInflow > 0 ? (totalLoanRepayments / totalInflow) * 100 : 0
        },
        loans: {
          amount: totalLoans,
          count: loans._count.id,
          percentage: totalOutflow > 0 ? (totalLoans / totalOutflow) * 100 : 0
        },
        withdrawals: {
          amount: totalWithdrawals,
          count: withdrawals._count.id,
          percentage: totalOutflow > 0 ? (totalWithdrawals / totalOutflow) * 100 : 0
        },
        expenses: {
          amount: totalExpenses,
          count: expenses._count.id,
          percentage: totalOutflow > 0 ? (totalExpenses / totalOutflow) * 100 : 0
        }
      },
      
      // Activity metrics
      activity: {
        newUsers: userActivity,
        totalTransactions: allFormattedTransactions.length,
        averageTransactionAmount: allFormattedTransactions.length > 0 
          ? allFormattedTransactions.reduce((sum, t) => sum + t.amount, 0) / allFormattedTransactions.length
          : 0
      },
      
      // Trends and analytics
      trends,
      transactions: allFormattedTransactions,
      
      // Previous period comparison
      comparison: {
        previousPeriod: {
          totalInflow: prevTotalInflow,
          totalOutflow: prevTotalOutflow,
          netBalance: prevNetBalance
        },
        growth: {
          inflow: Math.round(inflowGrowth * 100) / 100,
          outflow: Math.round(outflowGrowth * 100) / 100,
          balance: Math.round(balanceGrowth * 100) / 100
        }
      },
      
      // Database status
      databaseStatus: allTransactions.length > 0 ? 'connected' : 'fallback'
    });
  } catch (error) {
    console.error('Finance reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
