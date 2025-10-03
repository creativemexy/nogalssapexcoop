import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const contributeSchema = z.object({
  amount: z.number().min(1000, 'Minimum contribution amount is ₦1,000'),
  description: z.string().min(10, 'Description must be at least 10 characters')
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
    const validationResult = contributeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input data',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { amount, description } = validationResult.data;

    // Convert amount from naira to kobo for database storage
    const amountInKobo = Math.round(amount * 100);

    // Create contribution record
    const contribution = await prisma.contribution.create({
      data: {
        amount: amountInKobo,
        description,
        userId: targetUserId,
        cooperativeId: leader.cooperativeId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Contribution submitted successfully',
      contribution: {
        id: contribution.id,
        amount: Number(contribution.amount) / 100, // Convert from kobo to naira for display
        description: contribution.description,
        createdAt: contribution.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating leader contribution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


