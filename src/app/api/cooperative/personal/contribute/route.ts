import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { validateRequest } from '@/middleware/validation';
import { z } from 'zod';

const contributeSchema = z.object({
  amount: z.number().min(1000, 'Minimum contribution amount is ₦1,000'),
  description: z.string().min(1, 'Description is required'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'VIRTUAL_ACCOUNT', 'PAYSTACK'])
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
    const validationResult = contributeSchema.safeParse({
      ...body,
      amount: parseFloat(body.amount)
    });

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input data',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { amount, description, paymentMethod } = validationResult.data;
    const { user } = authResult;

    if (!user.cooperativeId) {
      return NextResponse.json({ error: 'No cooperative associated with user' }, { status: 400 });
    }

    // Generate unique reference
    const reference = `COOP_CONTRIB_${user.id}_${Date.now()}`;

    // Create contribution transaction
    const contribution = await prisma.transaction.create({
      data: {
        amount,
        type: 'CONTRIBUTION',
        description,
        status: 'PENDING',
        userId: user.id,
        cooperativeId: user.cooperativeId,
        reference: reference
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Contribution submitted successfully',
      contribution: {
        id: contribution.id,
        amount: contribution.amount,
        description: contribution.description,
        status: contribution.status,
        createdAt: contribution.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating cooperative contribution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


