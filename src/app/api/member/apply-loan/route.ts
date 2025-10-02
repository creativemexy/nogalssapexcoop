import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, checkDatabaseConnection } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          error: 'Database connection unavailable',
          message: 'Please try again later'
        }, { status: 503 });
      }
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { amount, purpose, repaymentPeriod } = await request.json();

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid loan amount' }, { status: 400 });
    }

    if (!purpose || purpose.trim().length === 0) {
      return NextResponse.json({ error: 'Purpose is required' }, { status: 400 });
    }

    if (!repaymentPeriod || repaymentPeriod < 6) {
      return NextResponse.json({ error: 'Minimum repayment period is 6 months' }, { status: 400 });
    }

    // Check loan eligibility
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

    if (!hasSixMonthsHistory) {
      return NextResponse.json({ 
        error: 'Not eligible for loan',
        message: 'You must have been contributing for at least 6 months'
      }, { status: 400 });
    }

    // Check if loan amount is within limit (6x contribution balance)
    const maxLoanAmount = contributionBalance * 6;
    if (amount > maxLoanAmount) {
      return NextResponse.json({ 
        error: 'Loan amount exceeds limit',
        message: `Maximum loan amount: ₦${maxLoanAmount.toLocaleString()}`
      }, { status: 400 });
    }

    // Create loan application
    const loan = await prisma.loan.create({
      data: {
        userId,
        amount: Math.round(amount * 100), // Convert to kobo
        purpose: purpose.trim(),
        repaymentPeriod: parseInt(repaymentPeriod),
        interestRate: 5, // 5% per annum
        status: 'PENDING',
        appliedAt: new Date()
      }
    });

    console.log('✅ Loan application created:', loan.id);

    return NextResponse.json({
      success: true,
      message: 'Loan application submitted successfully',
      loanId: loan.id
    });

  } catch (error) {
    console.error('Error creating loan application:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to submit loan application'
    }, { status: 500 });
  }
}
