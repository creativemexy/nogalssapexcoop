import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlockAccount, getAccountLockoutStatus } from '@/lib/account-lockout';

/**
 * Unlock a user account (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Unlock the account
    await unlockAccount(userId);

    // Log the action
    await prisma.log.create({
      data: {
        userId: (session.user as any).id,
        userEmail: (session.user as any).email || 'unknown',
        action: `Unlocked account for user ${user.email} (${user.firstName} ${user.lastName})`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Account unlocked successfully for ${user.firstName} ${user.lastName}`,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
    });
  } catch (error) {
    console.error('Error unlocking account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Get account lockout status (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get lockout status
    const lockoutStatus = await getAccountLockoutStatus(userId);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
      lockoutStatus,
    });
  } catch (error) {
    console.error('Error getting account lockout status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

