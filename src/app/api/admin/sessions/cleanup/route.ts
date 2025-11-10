import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SessionManager } from '@/lib/session-manager';

/**
 * API endpoint to clean up expired sessions
 * Can be called by cron job or manually by super admin
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow unauthenticated requests for cron jobs (with secret key)
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');
    const isCronRequest = cronSecret === process.env.CRON_SECRET_KEY;
    
    if (!session?.user && !isCronRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If authenticated, check if user is super admin
    if (session?.user && (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Clean up all expired sessions
    const result = await prisma.userSession.updateMany({
      where: {
        OR: [
          { isActive: false },
          { expiresAt: { lt: new Date() } },
        ],
      },
      data: { isActive: false },
    });

    // Also enforce session limits for all users
    const usersWithSessions = await prisma.userSession.groupBy({
      by: ['userId'],
      where: {
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    let invalidatedCount = 0;
    for (const group of usersWithSessions) {
      const activeSessions = await prisma.userSession.findMany({
        where: {
          userId: group.userId,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (activeSessions.length > 3) {
        // Invalidate oldest sessions beyond limit
        const toInvalidate = activeSessions.slice(0, activeSessions.length - 3);
        await prisma.userSession.updateMany({
          where: {
            id: { in: toInvalidate.map(s => s.id) },
          },
          data: { isActive: false },
        });
        invalidatedCount += toInvalidate.length;
      }
    }

    return NextResponse.json({
      success: true,
      expiredSessionsCleaned: result.count,
      excessSessionsInvalidated: invalidatedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Session cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup sessions' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check cleanup status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await SessionManager.getSessionStats();
    const expiredCount = await prisma.userSession.count({
      where: {
        OR: [
          { isActive: false },
          { expiresAt: { lt: new Date() } },
        ],
      },
    });

    return NextResponse.json({
      activeSessions: stats.totalActiveSessions,
      expiredSessions: expiredCount,
      totalUsers: stats.totalUsers,
      averageSessionsPerUser: stats.averageSessionsPerUser,
    });
  } catch (error) {
    console.error('Error fetching cleanup status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cleanup status' },
      { status: 500 }
    );
  }
}

