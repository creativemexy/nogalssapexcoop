import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all transactions with type 'FEE'
    const feeTransactions = await prisma.transaction.findMany({
      where: { type: 'FEE' },
      select: {
        id: true,
        amount: true,
        description: true,
        reference: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Get transaction counts by type
    const transactionCounts = await prisma.transaction.groupBy({
      by: ['type', 'status'],
      _count: { id: true },
      _sum: { amount: true },
    });

    return NextResponse.json({
      feeTransactions,
      transactionCounts,
      totalTransactions: await prisma.transaction.count(),
    });

  } catch (error) {
    console.error('Debug transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
