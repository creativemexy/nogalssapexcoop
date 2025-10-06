import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  category: z.enum(['OFFICE_SUPPLIES', 'UTILITIES', 'TRAVEL', 'MARKETING', 'MAINTENANCE', 'OTHER']),
  receiptUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['FINANCE', 'SUPER_ADMIN'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: any = { isActive: true };
    
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    if (category && category !== 'ALL') {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          creator: {
            select: { firstName: true, lastName: true, email: true }
          },
          approver: {
            select: { firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.expense.count({ where })
    ]);

    // Convert amounts from kobo to naira
    const formattedExpenses = expenses.map(expense => ({
      ...expense,
      amount: Number(expense.amount) / 100
    }));

    return NextResponse.json({
      expenses: formattedExpenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Expenses fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'FINANCE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = expenseSchema.parse(body);

    // Convert amount from naira to kobo for storage
    const expense = await prisma.expense.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        amount: validatedData.amount * 100, // Convert to kobo
        category: validatedData.category,
        receiptUrl: validatedData.receiptUrl || null,
        notes: validatedData.notes,
        createdBy: (session.user as any).id,
        status: 'PENDING'
      },
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
    }, { status: 201 });

  } catch (error) {
    console.error('Expense creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
