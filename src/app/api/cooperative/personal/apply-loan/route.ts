import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { validateRequest } from '@/middleware/validation';
import { z } from 'zod';

const applyLoanSchema = z.object({
  amount: z.number().min(10000, 'Minimum loan amount is ₦10,000'),
  purpose: z.string().min(1, 'Purpose is required'),
  duration: z.string().min(1, 'Duration is required'),
  collateral: z.string().optional(),
  repaymentPlan: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY'])
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'COOPERATIVE');
    if ('error' in authResult) {
      return authResult.error;
    }

    const body = await request.json();
    const validationResult = applyLoanSchema.safeParse({
      ...body,
      amount: parseFloat(body.amount)
    });

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input data',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { amount, purpose, duration, collateral, repaymentPlan } = validationResult.data;
    const { user } = authResult;

    if (!user.cooperativeId) {
      return NextResponse.json({ error: 'No cooperative associated with user' }, { status: 400 });
    }

    // Check loan eligibility: 6 months of constant contributions
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get cooperative's contribution history for the last 6 months
    const contributions = await prisma.transaction.findMany({
      where: {
        cooperativeId: user.cooperativeId,
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
        duration: parseInt(duration),
        collateral: collateral || null,
        repaymentPlan,
        status: 'PENDING',
        userId: user.id,
        cooperativeId: user.cooperativeId,
        dueDate
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Loan application submitted successfully',
      loan: {
        id: loan.id,
        amount: loan.amount,
        purpose: loan.purpose,
        duration: loan.duration,
        status: loan.status,
        createdAt: loan.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating cooperative loan application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


