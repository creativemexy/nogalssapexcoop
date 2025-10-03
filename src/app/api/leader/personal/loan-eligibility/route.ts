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

    // Check loan eligibility: 6 months of constant contributions
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get user's contribution history for the last 6 months
    const contributions = await prisma.contribution.findMany({
      where: {
        userId: targetUserId,
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Check if user has made contributions in all 6 months
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
    console.error('Error checking loan eligibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


