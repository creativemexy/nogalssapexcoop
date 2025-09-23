import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;
  // Fetch all successful deposit transactions for this user
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'CONTRIBUTION', // or 'DEPOSIT' if you use that type
      status: 'SUCCESSFUL',
    },
    orderBy: { createdAt: 'desc' },
  });
  const totalSavings = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  return NextResponse.json({
    totalSavings,
    transactions: transactions.map(tx => ({
      amount: Number(tx.amount),
      date: tx.createdAt,
      status: tx.status,
      reference: tx.reference,
    })),
  });
} 