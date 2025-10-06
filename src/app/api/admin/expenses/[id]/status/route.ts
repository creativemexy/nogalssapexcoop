import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const statusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']),
  notes: z.string().optional()
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = statusUpdateSchema.parse(body);

    const expense = await prisma.expense.findUnique({
      where: { id: params.id }
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const updateData: any = {
      status: validatedData.status,
      notes: validatedData.notes
    };

    // Set approval details if approving
    if (validatedData.status === 'APPROVED') {
      updateData.approvedBy = (session.user as any).id;
      updateData.approvedAt = new Date();
    }

    // Set payment date if marking as paid
    if (validatedData.status === 'PAID') {
      updateData.paidAt = new Date();
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: params.id },
      data: updateData,
      include: {
        creator: {
          select: { firstName: true, lastName: true, email: true }
        },
        approver: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    // Convert amount from kobo to naira
    return NextResponse.json({
      ...updatedExpense,
      amount: Number(updatedExpense.amount) / 100
    });

  } catch (error) {
    console.error('Expense status update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
