import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const BAL_KEY = 'SUPER_ADMIN_WALLET_BALANCE';
const MEMBER_KEY = 'SUPER_ADMIN_ALLOCATION_MEMBER_AMOUNT';
const COOP_KEY = 'SUPER_ADMIN_ALLOCATION_COOP_AMOUNT';

export async function GET() {
  try {
    const [balSetting, memberSetting, coopSetting, withdrawals] = await Promise.all([
      prisma.setting.findUnique({ where: { key: BAL_KEY } }),
      prisma.setting.findUnique({ where: { key: MEMBER_KEY } }),
      prisma.setting.findUnique({ where: { key: COOP_KEY } }),
      prisma.withdrawal.findMany({
        where: { user: { role: 'SUPER_ADMIN' } },
        orderBy: { requestedAt: 'desc' },
        take: 20,
      }),
    ]);

    const balance = balSetting ? Number(balSetting.value) : 0;
    const memberAmount = memberSetting ? Number(memberSetting.value) : 0;
    const cooperativeAmount = coopSetting ? Number(coopSetting.value) : 0;

    return NextResponse.json({ success: true, balance, memberAmount, cooperativeAmount, withdrawals });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch wallet' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const raw = body?.amount;
    const amount = typeof raw === 'string' ? Number(raw) : raw;
    const note = body?.note as string | undefined;

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'amount must be greater than zero' }, { status: 400 });
    }

    // Read current balance
    const balSetting = await prisma.setting.findUnique({ where: { key: BAL_KEY } });
    const current = balSetting ? Number(balSetting.value) : 0;
    if (amount > current) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Deduct and record withdrawal (single transaction)
    const updated = await prisma.$transaction(async (tx) => {
      // Update balance
      await tx.setting.upsert({
        where: { key: BAL_KEY },
        update: { value: String(current - amount) },
        create: { key: BAL_KEY, value: String(Math.max(0, current - amount)) },
      });

      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: (session.user as any).id,
          amount,
          reason: 'SUPER_ADMIN_WITHDRAWAL',
          status: 'PENDING',
          notes: note || undefined,
        },
      });

      return withdrawal;
    });

    return NextResponse.json({ success: true, withdrawal: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to withdraw' }, { status: 500 });
  }
}


