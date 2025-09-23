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

    // Check if user is super admin or apex
    if ((session.user as any).role !== 'SUPER_ADMIN' && (session.user as any).role !== 'APEX') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch dashboard statistics
    const [
      totalUsers,
      totalCooperatives,
      totalTransactions,
      pendingLoans,
      approvedLoans,
      rejectedLoans,
      totalContributionsResult,
      totalLoansResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.cooperative.count(),
      prisma.transaction.count(),
      prisma.loan.count({ where: { status: 'PENDING' } }),
      prisma.loan.count({ where: { status: 'APPROVED' } }),
      prisma.loan.count({ where: { status: 'REJECTED' } }),
      prisma.contribution.aggregate({
        _sum: { amount: true },
      }),
      prisma.loan.aggregate({
        _sum: { amount: true },
      }),
    ]);

    const totalContributions = totalContributionsResult._sum.amount || 0;
    const totalLoans = totalLoansResult._sum.amount || 0;

    return NextResponse.json({
      totalUsers,
      totalCooperatives,
      totalTransactions,
      pendingLoans,
      approvedLoans,
      rejectedLoans,
      totalContributions,
      totalLoans,
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 