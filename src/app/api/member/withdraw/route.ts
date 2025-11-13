import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateRequest } from '@/lib/mobile-auth';
import { prisma } from '@/lib/database';
import { isWithdrawalEnabled } from '@/lib/withdrawal-permissions';
import { notifyFinanceUsersOfWithdrawal } from '@/lib/finance-notifications';

export async function POST(request: NextRequest) {
  try {
    // Check if withdrawals are enabled for MEMBER role
    const withdrawalsEnabled = await isWithdrawalEnabled('MEMBER');
    if (!withdrawalsEnabled) {
      return NextResponse.json({ 
        error: 'Withdrawals are currently disabled for members',
        code: 'WITHDRAWAL_DISABLED'
      }, { status: 403 });
    }

    // Try mobile auth first (JWT), fallback to NextAuth session
    let userId: string | undefined;
    
    const mobileUser = await authenticateRequest(request);
    if (mobileUser) {
      userId = mobileUser.id;
    } else {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = (session.user as any).id;
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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

    // Notify finance users
    await notifyFinanceUsersOfWithdrawal({
      id: withdrawal.id,
      userId: withdrawal.userId,
      amount: Number(withdrawal.amount),
      reason: withdrawal.reason,
      status: withdrawal.status,
    });

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
