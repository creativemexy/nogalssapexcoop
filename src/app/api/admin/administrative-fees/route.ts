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

    // Calculate fund distributions (amounts are already in naira)
    const convertedRows = rows.map(row => {
      const amountNaira = Number(row.amount); // Amount is already in naira
      const apexFunds = amountNaira * 0.4; // 40% of amount
      const nogalssFunds = amountNaira * 0.2; // 20% of amount
      const cooperativeShare = amountNaira * 0.2; // 20% of amount
      const leaderShare = amountNaira * 0.2; // 20% of amount
      
      return {
        ...row,
        amount: amountNaira,
        apexFunds,
        nogalssFunds,
        cooperativeShare,
        leaderShare,
      };
    });

    const totalAmountNaira = Number(totalsAgg._sum.amount || 0);

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


