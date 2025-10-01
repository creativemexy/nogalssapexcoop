import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession, logSecurityEvent } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { emitDashboardUpdate } from '@/lib/notifications';
import { z } from 'zod';

const bulkActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'verify', 'unverify', 'delete']),
  userIds: z.array(z.string()),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    const body = await request.json();
    const validationResult = bulkActionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { action, userIds } = validationResult.data;

    if (userIds.length === 0) {
      return NextResponse.json({ error: 'No users selected' }, { status: 400 });
    }

    // Prevent self-modification for certain actions
    if (['deactivate', 'delete'].includes(action) && userIds.includes((session.user as any).id)) {
      return NextResponse.json({ error: 'You cannot perform this action on your own account' }, { status: 400 });
    }

    let updateData: any = {};
    let operation: string = '';

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        operation = 'USER_ACTIVATED';
        break;
      case 'deactivate':
        updateData = { isActive: false };
        operation = 'USER_DEACTIVATED';
        break;
      case 'verify':
        updateData = { isVerified: true };
        operation = 'USER_VERIFIED';
        break;
      case 'unverify':
        updateData = { isVerified: false };
        operation = 'USER_UNVERIFIED';
        break;
      case 'delete':
        // Handle delete separately
        await prisma.user.deleteMany({
          where: { id: { in: userIds } }
        });
        operation = 'USER_DELETED';
        break;
    }

    if (action !== 'delete') {
      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: updateData
      });
    }

    // Log security event
    await logSecurityEvent((session.user as any).id, operation, {
      targetUserIds: userIds,
      action,
      timestamp: new Date().toISOString(),
    });

    emitDashboardUpdate();

    return NextResponse.json({ 
      success: true, 
      message: `${action} action completed for ${userIds.length} user(s)` 
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 });
  }
}
