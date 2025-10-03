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

    // Get members with their financial statistics
    const members = await prisma.user.findMany({
      where: {
        cooperativeId,
        role: { in: ['MEMBER', 'LEADER'] }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        transactions: {
          where: {
            type: 'CONTRIBUTION'
          },
          select: {
            amount: true,
            status: true
          }
        },
        contributions: {
          select: {
            amount: true
          }
        },
        loans: {
          select: {
            amount: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate financial statistics for each member
    const membersWithStats = members.map(member => {
      const successfulContributions = member.transactions.filter(transaction => transaction.status === 'SUCCESSFUL');
      const transactionContributions = successfulContributions.reduce((sum, transaction) => sum + Number(transaction.amount), 0) / 100; // Convert from kobo to naira
      const directContributions = member.contributions.reduce((sum, contribution) => sum + Number(contribution.amount), 0) / 100; // Convert from kobo to naira
      const totalContributions = transactionContributions + directContributions;
      const totalLoans = member.loans.reduce((sum, loan) => sum + Number(loan.amount), 0) / 100; // Convert from kobo to naira
      const activeLoans = member.loans.filter(loan => loan.status === 'ACTIVE').length;

      // Debug logging for leader contributions
      if (member.role === 'LEADER') {
        console.log(`🔍 Leader ${member.firstName} ${member.lastName} transactions:`, member.transactions);
        console.log(`🔍 Leader contributions:`, member.contributions);
        console.log(`🔍 Transaction contributions: ₦${transactionContributions}`);
        console.log(`🔍 Direct contributions: ₦${directContributions}`);
        console.log(`🔍 Total contributions: ₦${totalContributions}`);
      }

      return {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phoneNumber: member.phoneNumber,
        role: member.role,
        isActive: member.isActive,
        createdAt: member.createdAt.toISOString(),
        totalContributions,
        totalLoans,
        activeLoans
      };
    });

    return NextResponse.json({ members: membersWithStats });
  } catch (error) {
    console.error('Error fetching cooperative members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}
