import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const loanApplicationSchema = z.object({
  amount: z.number().min(10000, 'Minimum loan amount is ₦10,000'),
  purpose: z.string().min(20, 'Purpose must be at least 20 characters'),
  duration: z.string().min(1, 'Duration is required'),
  collateral: z.string().optional(),
  repaymentPlan: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'])
});

export async function POST(request: NextRequest) {
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

    // Get the leader's cooperative ID
    const leader = await prisma.leader.findUnique({
      where: { userId: targetUserId },
      select: { cooperativeId: true }
    });

    if (!leader?.cooperativeId) {
      return NextResponse.json({ error: 'No cooperative associated with leader' }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = loanApplicationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input data',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { amount, purpose, duration, collateral, repaymentPlan } = validationResult.data;

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
    
    if (actualMonths < requiredMonths) {
      return NextResponse.json({ 
        error: `Loan eligibility requires ${requiredMonths} months of constant contributions. You have only ${actualMonths} months of contributions.`,
        eligibility: {
          requiredMonths,
          actualMonths,
          monthsRemaining: requiredMonths - actualMonths
        }
      }, { status: 400 });
    }

    // Calculate total contribution balance
    const totalContributions = contributions.reduce((sum, contrib) => sum + Number(contrib.amount), 0);
    
    // Calculate maximum loan amount (6 times contribution balance)
    const maxLoanAmount = totalContributions * 6;
    
    if (amount > maxLoanAmount) {
      return NextResponse.json({ 
        error: `Loan amount exceeds maximum allowed. Maximum loan amount is ₦${maxLoanAmount.toLocaleString()} (6 times your contribution balance of ₦${totalContributions.toLocaleString()})`,
        eligibility: {
          totalContributions,
          maxLoanAmount,
          requestedAmount: amount
        }
      }, { status: 400 });
    }

    // Calculate due date based on duration
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + parseInt(duration));

    // Create loan application
    const loan = await prisma.loan.create({
      data: {
        amount,
        purpose,
        interestRate: 0, // Default interest rate
        duration: parseInt(duration),
        status: 'PENDING',
        userId: targetUserId,
        cooperativeId: leader.cooperativeId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Loan application submitted successfully',
      loan: {
        id: loan.id,
        amount: loan.amount,
        purpose: loan.purpose,
        status: loan.status,
        endDate: loan.endDate,
        createdAt: loan.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating leader loan application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
