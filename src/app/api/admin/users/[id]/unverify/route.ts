import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession, logSecurityEvent } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { emitDashboardUpdate } from '@/lib/notifications';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: false }
    });

    await logSecurityEvent((session.user as any).id, 'USER_UNVERIFIED', {
      targetUserId: userId,
      targetEmail: user.email,
      timestamp: new Date().toISOString(),
    });

    emitDashboardUpdate();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unverifying user:', error);
    return NextResponse.json({ error: 'Failed to unverify user' }, { status: 500 });
  }
}
