import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { logSessionActivity, ActivityAction } from '@/lib/session-activity';

/**
 * Track activity for authenticated requests
 */
export async function trackActivity(
  request: NextRequest,
  response: NextResponse,
  action: ActivityAction,
  resource?: string
): Promise<void> {
  try {
    const token = await getToken({ req: request });
    
    if (!token?.id || !token?.sessionId) {
      return; // Not authenticated, skip tracking
    }

    const userId = token.id as string;
    const sessionId = token.sessionId as string;
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.ip || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;
    const method = request.method;

    // Determine resource if not provided
    if (!resource) {
      resource = request.nextUrl.pathname;
    }

    // Log the activity
    await logSessionActivity({
      sessionId,
      userId,
      action,
      resource,
      method,
      ipAddress,
      userAgent,
      metadata: {
        method,
        url: request.url,
        referer: request.headers.get('referer'),
      },
    });
  } catch (error) {
    // Don't throw - activity tracking should not break requests
    console.error('Failed to track activity:', error);
  }
}

/**
 * Determine activity action from request
 */
export function getActivityActionFromRequest(request: NextRequest): ActivityAction {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Login actions
  if (pathname.includes('/auth/signin') && method === 'POST') {
    return 'LOGIN';
  }

  // Logout actions
  if (pathname.includes('/auth/signout') || pathname.includes('/api/auth/signout')) {
    return 'LOGOUT';
  }

  // Password changes
  if (pathname.includes('/change-password') || pathname.includes('/reset-password')) {
    return 'PASSWORD_CHANGE';
  }

  // Withdrawal requests
  if (pathname.includes('/withdraw') && method === 'POST') {
    return 'WITHDRAWAL_REQUEST';
  }

  // Payment actions
  if (pathname.includes('/payments') && method === 'POST') {
    return 'PAYMENT_INITIATED';
  }

  // Profile updates
  if (pathname.includes('/profile') && (method === 'PUT' || method === 'PATCH')) {
    return 'PROFILE_UPDATE';
  }

  // Sensitive admin actions
  if (pathname.includes('/api/admin') || pathname.includes('/dashboard/super-admin')) {
    return 'SENSITIVE_ACTION';
  }

  // API calls
  if (pathname.startsWith('/api/')) {
    return 'API_CALL';
  }

  // Page views
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/app')) {
    return 'PAGE_VIEW';
  }

  return 'PAGE_VIEW'; // Default
}

