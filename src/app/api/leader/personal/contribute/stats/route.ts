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

    // If impersonation data is provided, use that instead of session data
    if (impersonationData) {
      try {
        const impersonatedUser = JSON.parse(impersonationData);
        targetUserId = impersonatedUser.id;
        userRole = impersonatedUser.role;
      } catch (error) {
        console.error('Error parsing impersonation data:', error);
      }
    }

    if (userRole !== 'LEADER') {
      return NextResponse.json({ error: 'Access denied. Leader role required.' }, { status: 403 });
    }

    // Get leader's contributions
    const contributions = await prisma.contribution.findMany({
      where: { userId: targetUserId },
      select: {
        amount: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate stats (convert from kobo to naira)
    const totalContributions = contributions.length;
    const totalAmount = contributions.reduce((sum, contrib) => sum + Number(contrib.amount) / 100, 0);
    const averageAmount = totalContributions > 0 ? totalAmount / totalContributions : 0;
    
    // This month's contributions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthContributions = contributions.filter(contrib => 
      new Date(contrib.createdAt) >= startOfMonth
    );
    const thisMonthAmount = thisMonthContributions.reduce((sum, contrib) => sum + Number(contrib.amount) / 100, 0);

    return NextResponse.json({
      totalContributions,
      totalAmount,
      averageAmount,
      thisMonthAmount
    });

  } catch (error) {
    console.error('Error fetching leader contribution stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
