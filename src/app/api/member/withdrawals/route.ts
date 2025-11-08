import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateRequest } from '@/lib/mobile-auth';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
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

    // Fetch the member's withdrawals
    const withdrawals = await prisma.withdrawal.findMany({
      where: { 
        userId
      },
      select: {
        id: true,
        amount: true,
        reason: true,
        status: true,
        requestedAt: true,
        processedAt: true,
        processedBy: true,
        rejectionReason: true,
      },
      orderBy: { requestedAt: 'desc' }
    });

    // Format withdrawals
    const formattedWithdrawals = withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      amount: Number(withdrawal.amount), // Amount in kobo
      reason: withdrawal.reason,
      status: withdrawal.status,
      requestedAt: withdrawal.requestedAt?.toISOString(),
      processedAt: withdrawal.processedAt?.toISOString(),
      processedBy: withdrawal.processedBy,
      rejectionReason: withdrawal.rejectionReason,
    }));

    return NextResponse.json({
      withdrawals: formattedWithdrawals,
      total: formattedWithdrawals.length,
    });

  } catch (error) {
    console.error('Error fetching member withdrawals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


