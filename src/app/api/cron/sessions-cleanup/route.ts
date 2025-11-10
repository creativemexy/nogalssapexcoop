import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionManager } from '@/lib/session-manager';

/**
 * Cron job endpoint for automatic session cleanup
 * 
 * This endpoint can be called by:
 * 1. Vercel Cron Jobs (vercel.json)
 * 2. External cron services (cron-job.org, EasyCron, etc.)
 * 3. GitHub Actions scheduled workflows
 * 4. Server cron (crontab)
 * 
 * To secure this endpoint, set CRON_SECRET_KEY in your environment variables
 * and pass it as a header: x-cron-secret: YOUR_SECRET_KEY
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET_KEY;
    
    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Clean up all expired sessions
    const expiredResult = await prisma.userSession.updateMany({
      where: {
        OR: [
          { isActive: false },
          { expiresAt: { lt: new Date() } },
        ],
      },
      data: { isActive: false },
    });

    // Enforce session limits for all users
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

    const stats = await SessionManager.getSessionStats();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cleanup: {
        expiredSessionsCleaned: expiredResult.count,
        excessSessionsInvalidated: invalidatedCount,
      },
      currentStats: {
        activeSessions: stats.totalActiveSessions,
        totalUsers: stats.totalUsers,
        averageSessionsPerUser: stats.averageSessionsPerUser,
      },
    });
  } catch (error) {
    console.error('Cron session cleanup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cleanup sessions',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for compatibility
export async function POST(request: NextRequest) {
  return GET(request);
}

