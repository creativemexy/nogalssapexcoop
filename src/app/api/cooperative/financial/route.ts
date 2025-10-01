import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSessionWithRoles } from '@/lib/security';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSessionWithRoles(session.user, ['SUPER_ADMIN', 'COOPERATIVE']);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    const cooperativeId = user.cooperativeId;

    if (!cooperativeId) {
      return NextResponse.json({ error: 'No cooperative associated with user' }, { status: 400 });
    }

    // Get comprehensive financial data
    const [
      totalContributions,
      totalLoans,
      totalExpenses,
      loanStatusBreakdown,
      topContributors,
      recentExpenses,
      monthlyContributions
    ] = await Promise.all([
      // Total contributions
      prisma.transaction.aggregate({
        where: {
          user: { cooperativeId },
          type: 'CONTRIBUTION',
          status: 'SUCCESSFUL'
        },
        _sum: { amount: true }
      }),

      // Total loans
      prisma.loan.aggregate({
        where: {
          user: { cooperativeId },
          status: { in: ['APPROVED', 'DISBURSED', 'ACTIVE', 'COMPLETED'] }
        },
        _sum: { amount: true }
      }),

      // Total expenses
      prisma.transaction.aggregate({
        where: {
          user: { cooperativeId },
          type: 'FEE',
          status: 'SUCCESSFUL'
        },
        _sum: { amount: true }
      }),

      // Loan status breakdown
      prisma.loan.groupBy({
        by: ['status'],
        where: {
          user: { cooperativeId }
        },
        _count: { id: true }
      }),

      // Top contributors
      prisma.user.findMany({
        where: {
          cooperativeId,
          role: { in: ['MEMBER', 'LEADER'] }
        },
        include: {
          transactions: {
            where: {
              type: 'CONTRIBUTION',
              status: 'SUCCESSFUL'
            },
            select: { amount: true }
          }
        },
        orderBy: {
          transactions: {
            _count: 'desc'
          }
        },
        take: 10
      }),

      // Recent expenses
      prisma.transaction.findMany({
        where: {
          user: { cooperativeId },
          type: 'FEE',
          status: 'SUCCESSFUL'
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Monthly contributions for the last 6 months
      prisma.transaction.groupBy({
        by: ['createdAt'],
        where: {
          user: { cooperativeId },
          type: 'CONTRIBUTION',
          status: 'SUCCESSFUL',
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        },
        _sum: { amount: true }
      })
    ]);

    // Calculate net position
    const netPosition = Number(totalContributions._sum.amount || 0) - Number(totalLoans._sum.amount || 0) - Number(totalExpenses._sum.amount || 0);

    // Format loan status breakdown
    const loanStatusMap = {
      active: 0,
      pending: 0,
      completed: 0,
      defaulted: 0
    };

    loanStatusBreakdown.forEach(status => {
      switch (status.status) {
        case 'ACTIVE':
          loanStatusMap.active = status._count.id;
          break;
        case 'PENDING':
          loanStatusMap.pending = status._count.id;
          break;
        case 'COMPLETED':
          loanStatusMap.completed = status._count.id;
          break;
        case 'DEFAULTED':
          loanStatusMap.defaulted = status._count.id;
          break;
      }
    });

    // Format top contributors
    const formattedTopContributors = topContributors.map(member => {
      const totalContributions = member.transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
      return {
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        totalContributions
      };
    }).sort((a, b) => b.totalContributions - a.totalContributions);

    // Format recent expenses
    const formattedRecentExpenses = recentExpenses.map(expense => ({
      id: expense.id,
      description: expense.description || 'No description',
      amount: expense.amount,
      date: expense.createdAt.toISOString(),
      memberName: `${expense.user.firstName} ${expense.user.lastName}`
    }));

    // Format monthly contributions
    const monthlyContributionsMap = new Map();
    monthlyContributions.forEach(contribution => {
      const month = new Date(contribution.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const existing = monthlyContributionsMap.get(month) || 0;
      monthlyContributionsMap.set(month, existing + (contribution._sum.amount || 0));
    });

    const formattedMonthlyContributions = Array.from(monthlyContributionsMap.entries()).map(([month, amount]) => ({
      month,
      amount
    }));

    const financialData = {
      totalContributions: Number(totalContributions._sum.amount || 0),
      totalLoans: Number(totalLoans._sum.amount || 0),
      totalExpenses: Number(totalExpenses._sum.amount || 0),
      netPosition,
      loanStatusBreakdown: loanStatusMap,
      topContributors: formattedTopContributors,
      recentExpenses: formattedRecentExpenses,
      monthlyContributions: formattedMonthlyContributions
    };

    return NextResponse.json(financialData);
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return NextResponse.json({ error: 'Failed to fetch financial data' }, { status: 500 });
  }
}
