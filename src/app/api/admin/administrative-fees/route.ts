import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { search, page = '1', limit = '10' } = Object.fromEntries(new URL(request.url).searchParams.entries());
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));

    const where = {
      AND: [
        { reference: { startsWith: 'REG_' } },
        search ? {
          OR: [
            { payer: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
            { cooperative: { contains: search as string, mode: 'insensitive' } },
            { reference: { contains: search as string, mode: 'insensitive' } },
          ]
        } : {}
      ]
    } as any;

    const [rows, count, totalsAgg] = await Promise.all([
      prisma.transaction.findMany({
        where: { reference: { startsWith: 'REG_' } },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.transaction.count({ where: { reference: { startsWith: 'REG_' } } }),
      prisma.transaction.aggregate({
        where: { reference: { startsWith: 'REG_' } },
        _sum: { amount: true }
      })
    ]);

    const pages = Math.max(1, Math.ceil(count / pageSize));

    // Convert amounts from kobo to naira
    const convertedRows = rows.map(row => ({
      ...row,
      amount: Number(row.amount) / 100,
      apexFunds: Number(row.amount) * 0.4 / 100, // 40% of amount in naira
      nogalssFunds: Number(row.amount) * 0.2 / 100, // 20% of amount in naira
      cooperativeShare: Number(row.amount) * 0.2 / 100, // 20% of amount in naira
      leaderShare: Number(row.amount) * 0.2 / 100, // 20% of amount in naira
    }));

    const totalAmountNaira = Number(totalsAgg._sum.amount || 0) / 100;

    return NextResponse.json({
      rows: convertedRows,
      pagination: { page: pageNum, pages, count },
      totals: {
        totalAmount: totalAmountNaira,
        apexFunds: totalAmountNaira * 0.4, // 40% of total
        nogalssFunds: totalAmountNaira * 0.2, // 20% of total
        cooperativeShare: totalAmountNaira * 0.2, // 20% of total
        leaderShare: totalAmountNaira * 0.2, // 20% of total
      }
    });
  } catch (error) {
    console.error('Administrative fees API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


