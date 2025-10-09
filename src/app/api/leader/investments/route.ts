import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createInvestmentSchema = z.object({
  amount: z.number().min(1000, 'Minimum investment amount is ₦1,000'),
  type: z.enum(['FIXED_DEPOSIT', 'SAVINGS_BOND', 'TREASURY_BILL', 'MUTUAL_FUND']),
  description: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a leader
    if ((session.user as any).role !== 'LEADER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get leader's cooperative
    const leader = await prisma.leader.findUnique({
      where: { userId: (session.user as any).id },
      include: { cooperative: true }
    });

    if (!leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    // Fetch investments for this leader
    const investments = await prisma.investment.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        createdAt: true,
        description: true
      }
    });

    return NextResponse.json({
      success: true,
      investments: investments.map(inv => ({
        ...inv,
        amount: inv.amount / 100 // Convert from kobo to naira
      }))
    });

  } catch (error) {
    console.error('Error fetching investments:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a leader
    if ((session.user as any).role !== 'LEADER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = createInvestmentSchema.parse({
      ...body,
      amount: parseFloat(body.amount)
    });

    // Get leader's cooperative
    const leader = await prisma.leader.findUnique({
      where: { userId: (session.user as any).id },
      include: { cooperative: true }
    });

    if (!leader) {
      return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
    }

    // Check if leader has sufficient balance (this would need to be implemented based on your business logic)
    // For now, we'll just create the investment record

    // Create investment
    const investment = await prisma.investment.create({
      data: {
        amount: Math.round(validatedData.amount * 100), // Convert to kobo for storage
        type: validatedData.type,
        status: 'PENDING',
        description: validatedData.description,
        userId: (session.user as any).id,
        cooperativeId: leader.cooperativeId
      },
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        createdAt: true,
        description: true
      }
    });

    // Create transaction record for the investment
    await prisma.transaction.create({
      data: {
        amount: Math.round(validatedData.amount * 100), // Convert to kobo
        type: 'INVESTMENT',
        description: `Investment: ${validatedData.type}`,
        status: 'PENDING',
        userId: (session.user as any).id,
        cooperativeId: leader.cooperativeId,
        reference: `INV_${Date.now()}`
      }
    });

    return NextResponse.json({
      success: true,
      investment: {
        ...investment,
        amount: investment.amount / 100 // Convert from kobo to naira
      }
    });

  } catch (error) {
    console.error('Error creating investment:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
