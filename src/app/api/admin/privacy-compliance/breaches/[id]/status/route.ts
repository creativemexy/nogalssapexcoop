import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuthFromSession } from '@/lib/security';
import { AuditLogger } from '@/lib/audit-logger';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    const { status } = await request.json();
    const breachId = params.id;

    const validStatuses = ['detected', 'investigating', 'contained', 'resolved'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        error: 'Invalid status. Must be one of: detected, investigating, contained, resolved'
      }, { status: 400 });
    }

    // Update breach status
    const breach = await prisma.dataBreach.update({
      where: { id: breachId },
      data: { 
        status,
        updatedAt: new Date()
      }
    });

    // Log the status update
    const { ipAddress, userAgent } = AuditLogger.extractRequestInfo(request);
    await AuditLogger.logDataBreach(
      breachId,
      `Status updated to ${status}`,
      breach.categories,
      breach.approximateDataSubjects,
      (session.user as any).id,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      breach,
      message: 'Breach status updated successfully'
    });

  } catch (error: any) {
    console.error('Failed to update breach status:', error);
    return NextResponse.json({
      error: 'Failed to update breach status'
    }, { status: 500 });
  }
}
