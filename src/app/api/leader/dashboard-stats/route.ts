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

    // Check for impersonation data in request headers
    const impersonationData = request.headers.get('x-impersonation-data');
    let targetUserId = (session.user as any).id;
    let userRole = (session.user as any).role;
    let cooperativeId = (session.user as any).cooperativeId;

    // If impersonation data is provided, use that instead of session data
    if (impersonationData) {
      try {
        const impersonatedUser = JSON.parse(impersonationData);
        targetUserId = impersonatedUser.id;
        userRole = impersonatedUser.role;
        cooperativeId = impersonatedUser.cooperativeId;
      } catch (error) {
        console.error('Error parsing impersonation data:', error);
      }
    }

    if (userRole !== 'LEADER') {
      return NextResponse.json({ error: 'Access denied. Leader role required.' }, { status: 403 });
    }

    // If cooperativeId is not directly available, fetch it from the leader record
    if (!cooperativeId) {
      const leader = await prisma.leader.findUnique({
        where: { userId: targetUserId },
        select: { cooperativeId: true }
      });
      
      if (!leader) {
        return NextResponse.json({ error: 'Leader record not found' }, { status: 404 });
      }
      
      cooperativeId = leader.cooperativeId;
    }

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
    // Convert amounts from kobo to naira for display
    const totalContributions = Number(totalContributionsResult._sum.amount || 0) / 100;
    
    return NextResponse.json({
      totalMembers,
      totalContributions,
      pendingLoans,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 