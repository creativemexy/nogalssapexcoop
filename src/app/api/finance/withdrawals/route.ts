import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Fetch all withdrawals for finance users
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'FINANCE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const skip = (page - 1) * limit;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              role: true,
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.withdrawal.count({ where }),
    ]);

    const formattedWithdrawals = withdrawals.map((w) => ({
      id: w.id,
      userId: w.userId,
      user: w.user,
      amount: Number(w.amount) / 100, // Convert from kobo to naira
      reason: w.reason,
      status: w.status,
      requestedAt: w.requestedAt.toISOString(),
      processedAt: w.processedAt?.toISOString(),
      processedBy: w.processedBy,
      notes: w.notes,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      withdrawals: formattedWithdrawals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}

