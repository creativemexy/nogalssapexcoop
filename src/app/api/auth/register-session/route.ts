import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionManager } from '@/lib/session-manager';

/**
 * API endpoint to register/update session with IP and user agent
 * Called after successful login to capture request metadata
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    // Get IP address and user agent from request
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      request.ip || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create or update session
    const sessionInfo = await SessionManager.createSession(userId, ipAddress, userAgent);

    return NextResponse.json({
      success: true,
      sessionId: sessionInfo.sessionId,
      expiresAt: sessionInfo.expiresAt,
    });
  } catch (error) {
    console.error('Error registering session:', error);
    return NextResponse.json(
      { error: 'Failed to register session' },
      { status: 500 }
    );
  }
}

