import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession } from '@/lib/security';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'COOPERATIVE');
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    const cooperativeId = user.cooperativeId;

    if (!cooperativeId) {
      return NextResponse.json({ error: 'No cooperative associated with user' }, { status: 400 });
    }

    // Check loan eligibility: 6 months of constant contributions
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get cooperative's contribution history for the last 6 months
    const contributions = await prisma.transaction.findMany({
      where: {
        cooperativeId,
        type: 'CONTRIBUTION',
        status: 'SUCCESSFUL',
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Check if cooperative has made contributions in all 6 months
    const monthlyContributions = new Map();
    contributions.forEach(contrib => {
      const monthKey = `${contrib.createdAt.getFullYear()}-${contrib.createdAt.getMonth()}`;
      if (!monthlyContributions.has(monthKey)) {
        monthlyContributions.set(monthKey, []);
      }
      monthlyContributions.get(monthKey).push(contrib);
    });

    const requiredMonths = 6;
    const actualMonths = monthlyContributions.size;
    const isEligible = actualMonths >= requiredMonths;
    
    // Calculate total contribution balance
    const totalContributions = contributions.reduce((sum, contrib) => sum + Number(contrib.amount), 0);
    
    // Calculate maximum loan amount (6 times contribution balance)
    const maxLoanAmount = totalContributions * 6;

    // Get recent contributions for display
    const recentContributions = contributions.slice(-5).map(contrib => ({
      amount: Number(contrib.amount),
      description: contrib.description,
      createdAt: contrib.createdAt.toISOString(),
      month: contrib.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    }));

    return NextResponse.json({
      isEligible,
      eligibility: {
        requiredMonths,
        actualMonths,
        monthsRemaining: Math.max(0, requiredMonths - actualMonths),
        totalContributions,
        maxLoanAmount,
        recentContributions
      },
      message: isEligible 
        ? `You are eligible for a loan up to ₦${maxLoanAmount.toLocaleString()}`
        : `You need ${requiredMonths - actualMonths} more months of contributions to be eligible for a loan`
    });

  } catch (error) {
    console.error('Error checking cooperative loan eligibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


