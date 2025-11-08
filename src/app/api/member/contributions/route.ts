import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateRequest } from '@/lib/mobile-auth';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Try mobile auth first (JWT), fallback to NextAuth session
    let userId: string | undefined;
    let userRole: string | undefined;
    
    const mobileUser = await authenticateRequest(request);
    if (mobileUser) {
      userId = mobileUser.id;
      userRole = mobileUser.role;
    } else {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = (session.user as any).id;
      userRole = (session.user as any).role;
    }
    
    if (!userId || !userRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (userRole !== 'MEMBER') {
      return NextResponse.json({ error: 'Access denied. Member role required.' }, { status: 403 });
    }

    // Fetch the member's contributions
    const contributions = await prisma.contribution.findMany({
      where: { 
        userId
      },
      select: {
        id: true,
        amount: true,
        description: true,
        createdAt: true,
        cooperative: {
          select: {
            id: true,
            name: true,
            registrationNumber: true,
            logo: true
          }
        }
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

    // Format contribution data (convert from kobo to naira)
    const formattedContributions = contributions.map(contribution => ({
      id: contribution.id,
      amount: Number(contribution.amount) / 100,
      description: contribution.description,
      createdAt: contribution.createdAt.toISOString(),
      cooperative: {
        id: contribution.cooperative.id,
        name: contribution.cooperative.name,
        registrationNumber: contribution.cooperative.registrationNumber,
        logo: contribution.cooperative.logo
      }
    }));

    return NextResponse.json({
      contributions: formattedContributions,
      stats: {
        totalContributions,
        totalAmount,
        averageAmount,
        thisMonthContributions: thisMonthContributions.length,
        thisMonthAmount
      }
    });

  } catch (error) {
    console.error('Error fetching member contributions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
