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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where clause based on filter
    let whereClause: any = {
      user: { cooperativeId }
    };

    if (filter !== 'all') {
      whereClause.type = filter.toUpperCase();
    }

    // Get transactions from both transaction and contribution tables
    const [transactions, contributions, totalCount] = await Promise.all([
      // Get transactions
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),

      // Get contributions (leader personal contributions)
      prisma.contribution.findMany({
        where: {
          cooperativeId
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),

      // Get total count
      prisma.transaction.count({
        where: whereClause
      })
    ]);

    // Format transactions
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount) / 100, // Convert from kobo to naira
      description: transaction.description,
      status: transaction.status,
      reference: transaction.reference,
      createdAt: transaction.createdAt,
      user: transaction.user
    }));

    // Format contributions
    const formattedContributions = contributions.map(contribution => ({
      id: contribution.id,
      type: 'CONTRIBUTION',
      amount: Number(contribution.amount) / 100, // Convert from kobo to naira
      description: contribution.description,
      status: 'SUCCESSFUL', // Contributions are always successful
      reference: `CONTRIB_${contribution.id}`,
      createdAt: contribution.createdAt,
      user: contribution.user
    }));

    // Combine and sort all transactions
    const allTransactions = [...formattedTransactions, ...formattedContributions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    // Calculate pagination
    const totalPages = Math.ceil((totalCount + contributions.length) / limit);

    return NextResponse.json({
      transactions: allTransactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: totalCount + contributions.length,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching cooperative transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
