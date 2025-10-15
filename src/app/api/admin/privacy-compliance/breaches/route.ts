import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuthFromSession } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    // Get recent data breaches
    const breaches = await prisma.dataBreach.findMany({
      where: status ? { status } : undefined,
      orderBy: { reportedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        description: true,
        categories: true,
        approximateDataSubjects: true,
        status: true,
        reportedAt: true,
        createdAt: true
      }
    });

    return NextResponse.json({ breaches });

  } catch (error: any) {
    console.error('Failed to fetch breaches:', error);
    return NextResponse.json({
      error: 'Failed to fetch data breaches'
    }, { status: 500 });
  }
}

