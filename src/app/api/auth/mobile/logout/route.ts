import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mobile-auth';
import { emitUserActivity } from '@/lib/notifications';
import { logSecurityEvent } from '@/lib/security';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request (mobile JWT or web session)
    const user = await authenticateRequest(request);
    
    if (user) {
      // Emit user activity event for logout
      emitUserActivity(
        { id: user.id, email: user.email || '', role: user.role },
        'USER_LOGOUT',
        { timestamp: new Date().toISOString() }
      );

      // Log security event for logout
      await logSecurityEvent(user.id, 'USER_LOGOUT', {
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
    }

    const origin = request.headers.get('origin') || '*';
    return NextResponse.json(
      { 
        success: true, 
        message: 'Logout successful' 
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  } catch (error: any) {
    console.error('Mobile logout error:', error);
    const origin = request.headers.get('origin') || '*';
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Logout failed' 
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }
}

