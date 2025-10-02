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
    const { amount, reason } = await request.json();

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // Get user's contribution balance
    const contributions = await prisma.contribution.findMany({
      where: { userId },
      select: { amount: true }
    });

    const totalContributions = contributions.reduce((sum, contrib) => sum + Number(contrib.amount), 0);
    const availableBalance = totalContributions / 100; // Convert from kobo to naira

    if (amount > availableBalance) {
      return NextResponse.json({ 
        error: 'Insufficient balance',
        message: `Available balance: ₦${availableBalance.toLocaleString()}`
      }, { status: 400 });
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amount: Math.round(amount * 100), // Convert to kobo
        reason: reason.trim(),
        status: 'PENDING',
        requestedAt: new Date()
      }
    });

    console.log('✅ Withdrawal request created:', withdrawal.id);

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawalId: withdrawal.id
    });

  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to submit withdrawal request'
    }, { status: 500 });
  }
}
