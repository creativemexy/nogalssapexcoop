import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const BAL_KEY = 'SUPER_ADMIN_WALLET_BALANCE';

async function paystackRequest(path: string, method: string, body?: any) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const base = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY not configured');
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === false) {
    throw new Error(data.message || `Paystack error (${res.status})`);
  }
  return data;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, bankCode, accountNumber, accountName } = await request.json();
    const amt = Number(amount);
    if (!amt || amt <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    if (!bankCode || !accountNumber || !accountName) {
      return NextResponse.json({ error: 'Bank details required' }, { status: 400 });
    }

    // Check balance
    const balSetting = await prisma.setting.findUnique({ where: { key: BAL_KEY } });
    const current = balSetting ? Number(balSetting.value) : 0;
    if (amt > current) {
      return NextResponse.json({ error: 'Insufficient balance', code: 'INSUFFICIENT_BALANCE' }, { status: 400 });
    }

    // Create transfer recipient
    const recipientResp = await paystackRequest('/transferrecipient', 'POST', {
      type: 'nuban',
      name: accountName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN',
    });
    const recipientCode = recipientResp?.data?.recipient_code;
    if (!recipientCode) throw new Error('Failed to create recipient');

    // Initiate transfer (amount in kobo)
    const transferResp = await paystackRequest('/transfer', 'POST', {
      source: 'balance',
      amount: Math.round(amt * 100),
      recipient: recipientCode,
      reason: 'Super Admin Wallet Withdrawal',
    });

    const providerId = transferResp?.data?.transfer_code || transferResp?.data?.reference || transferResp?.data?.id;

    // Record withdrawal and deduct balance in a transaction
    const withdrawal = await prisma.$transaction(async (tx) => {
      await tx.setting.upsert({
        where: { key: BAL_KEY },
        update: { value: String(Math.max(0, current - amt)) },
        create: { key: BAL_KEY, value: String(Math.max(0, current - amt)) },
      });

      const w = await tx.withdrawal.create({
        data: {
          userId: (session.user as any).id,
          amount: amt,
          reason: 'SUPER_ADMIN_WITHDRAWAL',
          status: 'PROCESSING',
          notes: JSON.stringify({ bankCode, accountNumber, accountName, recipientCode, providerId }),
        },
      });
      return w;
    });

    return NextResponse.json({ success: true, withdrawal, providerId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Withdrawal failed' }, { status: 500 });
  }
}


