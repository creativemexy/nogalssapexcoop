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
    const inflowResult = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESSFUL',
        reference: { startsWith: 'APEX_' },
        amount: { gt: 0 },
      },
    });
    const outflowResult = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESSFUL',
        reference: { startsWith: 'APEX_' },
        amount: { lt: 0 },
      },
    });
    const totalInflow = inflowResult._sum.amount ? Number(inflowResult._sum.amount) : 0;
    const totalOutflowRaw = outflowResult._sum.amount ? Number(outflowResult._sum.amount) : 0;
    const totalOutflow = Math.abs(totalOutflowRaw);
    const netBalance = totalInflow - totalOutflow;
    return NextResponse.json({ totalInflow, totalOutflow, netBalance });
  } catch (error) {
    console.error('Apex-Funds dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
