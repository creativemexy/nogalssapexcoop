import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logSessionActivity, ActivityAction } from '@/lib/session-activity';

/**
 * POST - Track a specific activity
 * Used by frontend to log custom activities
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const sessionId = (session?.user as any)?.sessionId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, resource, method, metadata, riskLevel } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID not found' }, { status: 400 });
    }

    await logSessionActivity({
      sessionId,
      userId,
      action: action as ActivityAction,
      resource,
      method,
      ipAddress,
      userAgent,
      metadata,
      riskLevel,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

