import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, checkDatabaseConnection } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      // In development, return empty data instead of error
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          virtualAccount: null,
          message: 'Database connection unavailable'
        });
      }
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Fetch virtual account for this user
    const virtualAccount = await prisma.virtualAccount.findFirst({
      where: {
        userId,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!virtualAccount) {
      return NextResponse.json({
        virtualAccount: null,
        message: 'No virtual account found'
      });
    }

    return NextResponse.json({
      virtualAccount: {
        accountNumber: virtualAccount.accountNumber,
        accountName: virtualAccount.accountName,
        bankName: virtualAccount.bankName,
        bankCode: virtualAccount.bankCode,
        customerCode: virtualAccount.customerCode,
        isActive: virtualAccount.isActive,
        createdAt: virtualAccount.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching virtual account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
