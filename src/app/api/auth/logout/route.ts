import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emitUserActivity } from '@/lib/notifications';
import { logSecurityEvent } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (session?.user) {
      // Emit user activity event for logout
      emitUserActivity(
        { id: (session.user as any).id!, email: session.user.email!, role: (session.user as any).role! },
        'USER_LOGOUT',
        { timestamp: new Date().toISOString() }
      );

      // Log security event for logout
      await logSecurityEvent((session.user as any).id!, 'USER_LOGOUT', {
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
    }

    // Clear the session by setting a cookie with an expired date
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Clear the session cookie
    response.cookies.set('next-auth.session-token', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
