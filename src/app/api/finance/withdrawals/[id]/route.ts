import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Get a specific withdrawal by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'FINANCE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: params.id },
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
    });

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      withdrawal: {
        ...withdrawal,
        amount: Number(withdrawal.amount) / 100,
        requestedAt: withdrawal.requestedAt.toISOString(),
        processedAt: withdrawal.processedAt?.toISOString(),
        createdAt: withdrawal.createdAt.toISOString(),
        updatedAt: withdrawal.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update withdrawal status (approve, reject, process)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'FINANCE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, notes } = await request.json();

    if (!status || !['APPROVED', 'REJECTED', 'PROCESSED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be APPROVED, REJECTED, or PROCESSED' },
        { status: 400 }
      );
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: params.id },
    });

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }

    const updateData: any = {
      status,
      notes: notes || withdrawal.notes,
    };

    if (status === 'APPROVED' || status === 'REJECTED' || status === 'PROCESSED') {
      updateData.processedAt = new Date();
      updateData.processedBy = (session.user as any).id;
    }

    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id: params.id },
      data: updateData,
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
    });

    return NextResponse.json({
      success: true,
      withdrawal: {
        ...updatedWithdrawal,
        amount: Number(updatedWithdrawal.amount) / 100,
        requestedAt: updatedWithdrawal.requestedAt.toISOString(),
        processedAt: updatedWithdrawal.processedAt?.toISOString(),
        createdAt: updatedWithdrawal.createdAt.toISOString(),
        updatedAt: updatedWithdrawal.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to update withdrawal' },
      { status: 500 }
    );
  }
}

