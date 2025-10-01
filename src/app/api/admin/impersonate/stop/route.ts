import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession, logImpersonationEvent } from '@/lib/security';

export async function POST(request: NextRequest) {
  // Get session and validate with proper type safety
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;
  const { targetUserId } = await request.json();

  if (!targetUserId) {
    return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
  }

  try {
    // Log impersonation stop
    await logImpersonationEvent(user.id, targetUserId, 'STOP', {
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Impersonation stopped successfully',
    });

  } catch (error) {
    console.error('Error stopping impersonation:', error);
    return NextResponse.json({ error: 'Failed to stop impersonation' }, { status: 500 });
  }
}

