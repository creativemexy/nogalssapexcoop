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

    // Get cooperative statistics
    const [
      totalMembers,
      totalContributions,
      totalContributionsFromTable,
      totalLoans,
      activeLoans,
      pendingLoans,
      totalExpenses,
      recentTransactions,
      memberStats,
      virtualAccount
    ] = await Promise.all([
      // Total members in cooperative
      prisma.user.count({
        where: {
          cooperativeId,
          role: { in: ['MEMBER', 'LEADER'] },
          isActive: true
        }
      }),

      // Total contributions from transactions
      prisma.transaction.aggregate({
        where: {
          user: { cooperativeId },
          type: 'CONTRIBUTION',
          status: 'SUCCESSFUL'
        },
        _sum: { amount: true }
      }),

      // Total contributions from contribution table (leader personal contributions)
      prisma.contribution.aggregate({
        where: {
          cooperativeId
        },
        _sum: { amount: true }
      }),

      // Total loans disbursed
      prisma.loan.aggregate({
        where: {
          user: { cooperativeId },
          status: { in: ['APPROVED', 'DISBURSED', 'ACTIVE', 'COMPLETED'] }
        },
        _sum: { amount: true }
      }),

      // Active loans
      prisma.loan.count({
        where: {
          user: { cooperativeId },
          status: 'ACTIVE'
        }
      }),

      // Pending loans
      prisma.loan.count({
        where: {
          user: { cooperativeId },
          status: 'PENDING'
        }
      }),

      // Total registration fees paid by members
      prisma.transaction.aggregate({
        where: {
          user: { cooperativeId },
          type: 'FEE',
          description: {
            contains: 'registration fee',
            mode: 'insensitive'
          },
          status: 'SUCCESSFUL'
        },
        _sum: { amount: true }
      }),

      // Recent transactions
      prisma.transaction.findMany({
        where: {
          user: { cooperativeId }
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

      // Member statistics
      Promise.all([
        // Active members
        prisma.user.count({
          where: {
            cooperativeId,
            role: { in: ['MEMBER', 'LEADER'] },
            isActive: true
          }
        }),

        // New members this month
        prisma.user.count({
          where: {
            cooperativeId,
            role: { in: ['MEMBER', 'LEADER'] },
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),

        // Average contribution
        prisma.transaction.aggregate({
          where: {
            user: { cooperativeId },
            type: 'CONTRIBUTION',
            status: 'SUCCESSFUL'
          },
          _avg: { amount: true }
        })
      ]),

      // Virtual account for cooperative
      prisma.virtualAccount.findFirst({
        where: {
          user: { cooperativeId },
          accountType: 'COOPERATIVE',
          isActive: true
        },
        select: {
          id: true,
          accountName: true,
          accountNumber: true,
          bankName: true,
          accountType: true,
          isActive: true
        }
      })
    ]);

    // Format recent transactions
    const formattedTransactions = recentTransactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount) / 100, // Convert from kobo to naira
      description: transaction.description || 'No description',
      date: transaction.createdAt.toISOString(),
      memberName: `${transaction.user.firstName} ${transaction.user.lastName}`
    }));

    // Calculate member statistics
    const [activeMembers, newMembersThisMonth, averageContributionResult] = memberStats;
    const averageContribution = averageContributionResult._avg.amount || 0;

    // Calculate 20% allocation
    const totalContributionsAmount = (Number(totalContributions._sum.amount || 0) + Number(totalContributionsFromTable._sum.amount || 0)) / 100;
    const allocation20Percent = totalContributionsAmount * 0.2;

    const stats = {
      totalMembers,
      totalContributions: totalContributionsAmount,
      totalLoans: Number(totalLoans._sum.amount || 0) / 100, // Convert from kobo to naira
      activeLoans,
      pendingLoans,
      registrationFees: Number(totalExpenses._sum.amount || 0) / 100, // Convert from kobo to naira
      allocation20Percent: Math.round(allocation20Percent),
      recentTransactions: formattedTransactions,
      memberStats: {
        activeMembers,
        newMembersThisMonth,
        averageContribution: Math.round(Number(averageContribution) / 100) // Convert from kobo to naira
      },
      virtualAccount: virtualAccount || null
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching cooperative stats:', error);
    return NextResponse.json({ error: 'Failed to fetch cooperative statistics' }, { status: 500 });
  }
}
