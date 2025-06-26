import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'APEX') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cooperatives = await prisma.cooperative.findMany({
      include: {
        bank: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatted = cooperatives.map(c => ({
      id: c.id,
      name: c.name,
      registrationNumber: c.registrationNumber,
      address: c.address,
      city: c.city,
      phoneNumber: c.phoneNumber,
      email: c.email,
      bankName: c.bankName,
      bankAccountNumber: c.bankAccountNumber,
      description: c.description || '',
      isActive: c.isActive,
      approved: c.approved || false,
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({ cooperatives: formatted });
  } catch (e) {
    console.error('Error fetching cooperatives:', e);
    return NextResponse.json({ error: 'Failed to fetch cooperatives' }, { status: 500 });
  }
} 