import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession, logSecurityEvent } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { emitDashboardUpdate } from '@/lib/notifications';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Ensure target exists
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-deletion (optional safety)
    if ((session.user as any).id === userId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: userId } });

    await logSecurityEvent((session.user as any).id, 'USER_DELETED', {
      targetUserId: userId,
      targetEmail: existing.email,
      targetRole: existing.role,
      timestamp: new Date().toISOString(),
    });

    emitDashboardUpdate();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}


