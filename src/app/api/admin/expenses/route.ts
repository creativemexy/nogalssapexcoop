import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const statusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']),
  notes: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
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

    const [expenses, total, stats] = await Promise.all([
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
      prisma.expense.count({ where }),
      prisma.expense.groupBy({
        by: ['status'],
        _sum: { amount: true },
        _count: { id: true },
        where: { isActive: true }
      })
    ]);

    // Convert amounts from kobo to naira
    const formattedExpenses = expenses.map(expense => ({
      ...expense,
      amount: Number(expense.amount) / 100
    }));

    // Calculate statistics
    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = {
        count: stat._count.id,
        totalAmount: Number(stat._sum.amount || 0) / 100
      };
      return acc;
    }, {} as Record<string, { count: number; totalAmount: number }>);

    return NextResponse.json({
      expenses: formattedExpenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      statusStats
    });

  } catch (error) {
    console.error('Admin expenses fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
