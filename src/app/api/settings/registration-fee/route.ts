import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { key: 'registrationFee' } });
  return NextResponse.json({ fee: setting ? Number(setting.value) : 0 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'APEX') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { fee } = await req.json();
  if (typeof fee !== 'number' || fee < 0) {
    return NextResponse.json({ error: 'Invalid fee' }, { status: 400 });
  }
  const setting = await prisma.setting.upsert({
    where: { key: 'registrationFee' },
    update: { value: String(fee) },
    create: { key: 'registrationFee', value: String(fee) },
  });
  return NextResponse.json({ fee: Number(setting.value) });
} 