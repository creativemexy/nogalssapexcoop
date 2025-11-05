import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get user's contributions
    const contributions = await prisma.contribution.findMany({
      where: { userId },
      select: { amount: true, createdAt: true }
    });

    const totalContributions = contributions.reduce((sum, contrib) => sum + Number(contrib.amount), 0);
    const contributionBalance = totalContributions / 100; // Convert from kobo to naira

    // Check if user has been contributing for at least 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const hasSixMonthsHistory = contributions.some(contrib => 
      new Date(contrib.createdAt) <= sixMonthsAgo
    );

    // Check if user has any pending loans
    const pendingLoans = await prisma.loan.count({
      where: {
        userId,
        status: 'PENDING'
      }
    });

    if (pendingLoans > 0) {
      return NextResponse.json({
        isEligible: false,
        reason: 'You have a pending loan application',
        maxLoanAmount: 0
      });
    }

    if (!hasSixMonthsHistory) {
      return NextResponse.json({
        isEligible: false,
        reason: 'You must have been contributing for at least 6 months',
        maxLoanAmount: 0
      });
    }

    if (contributionBalance === 0) {
      return NextResponse.json({
        isEligible: false,
        reason: 'You need to make contributions before applying for a loan',
        maxLoanAmount: 0
      });
    }

    // Calculate maximum loan amount (6x contribution balance)
    const maxLoanAmount = contributionBalance * 6;

    return NextResponse.json({
      isEligible: true,
      reason: 'You are eligible for a loan',
      maxLoanAmount,
      contributionBalance,
      monthsContributing: contributions.length
    });

  } catch (error) {
    console.error('Error checking loan eligibility:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to check loan eligibility'
    }, { status: 500 });
  }
}
