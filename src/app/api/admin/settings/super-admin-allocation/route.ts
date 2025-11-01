import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MEMBER_KEY = 'SUPER_ADMIN_ALLOCATION_MEMBER_AMOUNT';
const COOP_KEY = 'SUPER_ADMIN_ALLOCATION_COOP_AMOUNT';

export async function GET() {
  try {
    const [memberSetting, coopSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: MEMBER_KEY } }),
      prisma.setting.findUnique({ where: { key: COOP_KEY } }),
    ]);
    const memberAmount = memberSetting ? Number(memberSetting.value) : 0;
    const cooperativeAmount = coopSetting ? Number(coopSetting.value) : 0;
    return NextResponse.json({ success: true, memberAmount, cooperativeAmount });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch amounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const rawMember = body?.memberAmount;
    const rawCoop = body?.cooperativeAmount;
    const memberAmount = typeof rawMember === 'string' ? Number(rawMember) : rawMember;
    const cooperativeAmount = typeof rawCoop === 'string' ? Number(rawCoop) : rawCoop;

    if (memberAmount === undefined || Number.isNaN(memberAmount)) {
      return NextResponse.json({ error: 'memberAmount is required and must be a number' }, { status: 400 });
    }
    if (cooperativeAmount === undefined || Number.isNaN(cooperativeAmount)) {
      return NextResponse.json({ error: 'cooperativeAmount is required and must be a number' }, { status: 400 });
    }
    if (memberAmount < 0 || cooperativeAmount < 0) {
      return NextResponse.json({ error: 'amounts cannot be negative' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.setting.upsert({
        where: { key: MEMBER_KEY },
        update: { value: String(memberAmount) },
        create: { key: MEMBER_KEY, value: String(memberAmount) },
      }),
      prisma.setting.upsert({
        where: { key: COOP_KEY },
        update: { value: String(cooperativeAmount) },
        create: { key: COOP_KEY, value: String(cooperativeAmount) },
      }),
    ]);

    return NextResponse.json({ success: true, memberAmount, cooperativeAmount });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save amounts' }, { status: 500 });
  }
}


