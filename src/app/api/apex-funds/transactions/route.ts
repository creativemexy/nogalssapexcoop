import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['APEX_FUNDS', 'SUPER_ADMIN'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const transactions = await prisma.transaction.findMany({
      where: { reference: { startsWith: 'APEX_' } },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        type: true,
        amount: true,
        status: true,
        reference: true,
      },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Apex-Funds transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}







