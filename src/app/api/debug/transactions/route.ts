import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all transactions to see what exists
    const allTransactions = await prisma.transaction.findMany({
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        reference: true,
        description: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Get FEE transactions specifically
    const feeTransactions = await prisma.transaction.findMany({
      where: { type: 'FEE' },
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        reference: true,
        description: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get REG_ reference transactions
    const regTransactions = await prisma.transaction.findMany({
      where: { reference: { startsWith: 'REG_' } },
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        reference: true,
        description: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      allTransactions,
      feeTransactions,
      regTransactions,
      totalCount: allTransactions.length,
      feeCount: feeTransactions.length,
      regCount: regTransactions.length
    });

  } catch (error) {
    console.error('Debug transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
