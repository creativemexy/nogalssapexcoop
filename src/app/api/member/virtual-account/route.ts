import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
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
