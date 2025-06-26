import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let banks = await prisma.bank.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // If no banks exist, return some default Nigerian banks
    if (banks.length === 0) {
      banks = [
        { id: 'default-1', name: 'Access Bank' },
        { id: 'default-2', name: 'First Bank of Nigeria' },
        { id: 'default-3', name: 'Guaranty Trust Bank (GTB)' },
        { id: 'default-4', name: 'United Bank for Africa (UBA)' },
        { id: 'default-5', name: 'Zenith Bank' },
        { id: 'default-6', name: 'Ecobank Nigeria' },
        { id: 'default-7', name: 'Stanbic IBTC Bank' },
        { id: 'default-8', name: 'Fidelity Bank' },
        { id: 'default-9', name: 'Union Bank of Nigeria' },
        { id: 'default-10', name: 'Wema Bank' },
      ];
    }

    return NextResponse.json({ banks });
  } catch (error) {
    console.error('Error fetching banks:', error);
    return NextResponse.json({ error: 'Failed to fetch banks' }, { status: 500 });
  }
} 