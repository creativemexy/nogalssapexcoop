import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionManager } from '@/lib/session-manager';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any).role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get session statistics
    const [totalActiveSessions, totalUsers, allSessions] = await Promise.all([
      prisma.userSession.count({
        where: {
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      }),
      prisma.user.count(),
      prisma.userSession.findMany({
        where: {
          isActive: true,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Calculate average sessions per user
    const averageSessionsPerUser = totalUsers > 0 ? totalActiveSessions / totalUsers : 0;

    const sessions = allSessions.map(session => ({
      id: session.id,
      userId: session.userId,
      user: session.user,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }));

    return NextResponse.json({ 
      sessions,
      totalActiveSessions,
      totalUsers,
      averageSessionsPerUser
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any).role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (userId) {
      const count = await SessionManager.invalidateAllUserSessions(userId);
      return NextResponse.json({ success: true, invalidatedSessions: count });
    } else if (sessionId) {
      const success = await SessionManager.invalidateSession(sessionId);
      return NextResponse.json({ success });
    } else {
      return NextResponse.json({ error: 'userId or sessionId required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error invalidating sessions:', error);
    return NextResponse.json({ error: 'Failed to invalidate sessions' }, { status: 500 });
  }
}

