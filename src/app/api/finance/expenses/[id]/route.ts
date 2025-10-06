import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  category: z.enum(['OFFICE_SUPPLIES', 'UTILITIES', 'TRAVEL', 'MARKETING', 'MAINTENANCE', 'OTHER']).optional(),
  receiptUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional()
});

const statusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']),
  notes: z.string().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['FINANCE', 'SUPER_ADMIN'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: { firstName: true, lastName: true, email: true }
        },
        approver: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Convert amount from kobo to naira
    return NextResponse.json({
      ...expense,
      amount: Number(expense.amount) / 100
    });

  } catch (error) {
    console.error('Expense fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'FINANCE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateExpenseSchema.parse(body);

    // Check if expense exists and belongs to the user
    const existingExpense = await prisma.expense.findUnique({
      where: { id: params.id }
    });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    if (existingExpense.createdBy !== (session.user as any).id) {
      return NextResponse.json({ error: 'You can only edit your own expenses' }, { status: 403 });
    }

    if (existingExpense.status !== 'PENDING') {
      return NextResponse.json({ error: 'Cannot edit approved or processed expenses' }, { status: 400 });
    }

    const updateData: any = { ...validatedData };
    if (validatedData.amount) {
      updateData.amount = validatedData.amount * 100; // Convert to kobo
    }

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: updateData,
      include: {
        creator: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    // Convert amount back to naira for response
    return NextResponse.json({
      ...expense,
      amount: Number(expense.amount) / 100
    });

  } catch (error) {
    console.error('Expense update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'FINANCE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id: params.id }
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    if (expense.createdBy !== (session.user as any).id) {
      return NextResponse.json({ error: 'You can only delete your own expenses' }, { status: 403 });
    }

    if (expense.status !== 'PENDING') {
      return NextResponse.json({ error: 'Cannot delete approved or processed expenses' }, { status: 400 });
    }

    await prisma.expense.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Expense deleted successfully' });

  } catch (error) {
    console.error('Expense deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
