import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSessionActivities, getActivityStats } from '@/lib/session-activity';

/**
 * GET - Get session activities
 * Query params:
 * - sessionId: Filter by session ID
 * - userId: Filter by user ID
 * - limit: Number of results (default: 100)
 * - riskLevel: Filter by risk level (LOW, MEDIUM, HIGH, CRITICAL)
 * - startDate: ISO date string
 * - endDate: ISO date string
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const riskLevel = searchParams.get('riskLevel') as any || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const activities = await getSessionActivities({
      sessionId,
      userId,
      limit,
      riskLevel,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      activities,
      count: activities.length,
    });
  } catch (error) {
    console.error('Error fetching session activities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

