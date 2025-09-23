import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'LEADER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const cooperativeId = (session.user as any).cooperativeId;
    if (!cooperativeId) {
      return NextResponse.json({ error: 'No cooperative found for leader' }, { status: 400 });
    }
    const [
      totalMembers,
      totalContributionsResult,
      pendingLoans
    ] = await Promise.all([
      prisma.user.count({ where: { cooperativeId } }),
      prisma.contribution.aggregate({
        where: { cooperativeId },
        _sum: { amount: true },
      }),
      prisma.loan.count({ where: { cooperativeId, status: 'PENDING' } }),
    ]);
    const totalContributions = totalContributionsResult._sum.amount || 0;
    return NextResponse.json({
      totalMembers,
      totalContributions,
      pendingLoans,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 