import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get expense statistics
    const [
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      paidExpenses,
      rejectedExpenses,
      recentExpenses
    ] = await Promise.all([
      // Total expenses
      prisma.expense.aggregate({
        where: { isActive: true },
        _sum: { amount: true },
        _count: { id: true }
      }),
      // Pending expenses
      prisma.expense.aggregate({
        where: { isActive: true, status: 'PENDING' },
        _sum: { amount: true },
        _count: { id: true }
      }),
      // Approved expenses
      prisma.expense.aggregate({
        where: { isActive: true, status: 'APPROVED' },
        _sum: { amount: true },
        _count: { id: true }
      }),
      // Paid expenses
      prisma.expense.aggregate({
        where: { isActive: true, status: 'PAID' },
        _sum: { amount: true },
        _count: { id: true }
      }),
      // Rejected expenses
      prisma.expense.aggregate({
        where: { isActive: true, status: 'REJECTED' },
        _sum: { amount: true },
        _count: { id: true }
      }),
      // Recent expenses
      prisma.expense.findMany({
        where: { isActive: true },
        include: {
          creator: {
            select: { firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    // Convert amounts from kobo to naira
    const formatAmount = (amount: any) => Number(amount || 0) / 100;

    return NextResponse.json({
      total: {
        amount: formatAmount(totalExpenses._sum.amount),
        count: totalExpenses._count.id
      },
      pending: {
        amount: formatAmount(pendingExpenses._sum.amount),
        count: pendingExpenses._count.id
      },
      approved: {
        amount: formatAmount(approvedExpenses._sum.amount),
        count: approvedExpenses._count.id
      },
      paid: {
        amount: formatAmount(paidExpenses._sum.amount),
        count: paidExpenses._count.id
      },
      rejected: {
        amount: formatAmount(rejectedExpenses._sum.amount),
        count: rejectedExpenses._count.id
      },
      recent: recentExpenses.map(expense => ({
        ...expense,
        amount: formatAmount(expense.amount)
      }))
    });

  } catch (error) {
    console.error('Expense stats fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
