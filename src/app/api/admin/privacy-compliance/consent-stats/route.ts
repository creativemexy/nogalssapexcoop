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

    // Get consent statistics
    const [
      totalConsents,
      activeConsents,
      withdrawnConsents
    ] = await Promise.all([
      prisma.consentRecord.count(),
      prisma.consentRecord.count({
        where: {
          consentGiven: true,
          withdrawalDate: null
        }
      }),
      prisma.consentRecord.count({
        where: {
          consentGiven: false,
          withdrawalDate: { not: null }
        }
      })
    ]);

    const consentRate = totalConsents > 0 ? (activeConsents / totalConsents) * 100 : 0;

    return NextResponse.json({
      totalConsents,
      activeConsents,
      withdrawnConsents,
      consentRate
    });

  } catch (error: any) {
    console.error('Failed to fetch consent stats:', error);
    return NextResponse.json({
      error: 'Failed to fetch consent statistics'
    }, { status: 500 });
  }
}

