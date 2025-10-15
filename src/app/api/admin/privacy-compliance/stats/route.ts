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

    // Get comprehensive compliance statistics
    const [
      totalDataSubjects,
      activeConsents,
      dataBreaches,
      retentionPolicies,
      auditLogs,
      dataSubjectRequests
    ] = await Promise.all([
      prisma.user.count(),
      prisma.consentRecord.count({
        where: {
          consentGiven: true,
          withdrawalDate: null
        }
      }),
      prisma.dataBreach.count(),
      prisma.dataRetentionPolicy.count({
        where: { isActive: true }
      }),
      prisma.auditLog.count(),
      prisma.dataSubjectRequest.count()
    ]);

    return NextResponse.json({
      totalDataSubjects,
      activeConsents,
      dataBreaches,
      retentionPolicies,
      auditLogs,
      dataSubjectRequests
    });

  } catch (error: any) {
    console.error('Failed to fetch compliance stats:', error);
    return NextResponse.json({
      error: 'Failed to fetch compliance statistics'
    }, { status: 500 });
  }
}

