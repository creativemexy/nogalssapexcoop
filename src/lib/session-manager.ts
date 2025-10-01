import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export interface SessionInfo {
  id: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export class SessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  private static readonly MAX_CONCURRENT_SESSIONS = 3; // Maximum concurrent sessions per user

  /**
   * Create a new session for a user
   */
  static async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<SessionInfo> {
    // Clean up expired sessions first
    await this.cleanupExpiredSessions(userId);

    // Check concurrent session limit
    await this.enforceSessionLimit(userId);

    const sessionId = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.SESSION_TIMEOUT);

    const session = await prisma.userSession.create({
      data: {
        userId,
        sessionId,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    return {
      id: session.id,
      sessionId: session.sessionId,
      ipAddress: session.ipAddress || undefined,
      userAgent: session.userAgent || undefined,
      isActive: session.isActive,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
  }

  /**
   * Validate a session and update its expiration
   */
  static async validateSession(sessionId: string): Promise<SessionInfo | null> {
    const session = await prisma.userSession.findUnique({
      where: { sessionId },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return null;
    }

    // Update expiration time
    const newExpiresAt = new Date(Date.now() + this.SESSION_TIMEOUT);
    await prisma.userSession.update({
      where: { id: session.id },
      data: { expiresAt: newExpiresAt },
    });

    return {
      id: session.id,
      sessionId: session.sessionId,
      ipAddress: session.ipAddress || undefined,
      userAgent: session.userAgent || undefined,
      isActive: session.isActive,
      createdAt: session.createdAt,
      expiresAt: newExpiresAt,
    };
  }

  /**
   * Invalidate a specific session
   */
  static async invalidateSession(sessionId: string): Promise<boolean> {
    try {
      await prisma.userSession.update({
        where: { sessionId },
        data: { isActive: false },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  static async invalidateAllUserSessions(userId: string): Promise<number> {
    const result = await prisma.userSession.updateMany({
      where: { userId },
      data: { isActive: false },
    });
    return result.count;
  }

  /**
   * Get active sessions for a user
   */
  static async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map(session => ({
      id: session.id,
      sessionId: session.sessionId,
      ipAddress: session.ipAddress || undefined,
      userAgent: session.userAgent || undefined,
      isActive: session.isActive,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }));
  }

  /**
   * Clean up expired sessions for a user
   */
  private static async cleanupExpiredSessions(userId: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: {
        userId,
        OR: [
          { isActive: false },
          { expiresAt: { lt: new Date() } },
        ],
      },
      data: { isActive: false },
    });
  }

  /**
   * Enforce concurrent session limit
   */
  private static async enforceSessionLimit(userId: string): Promise<void> {
    const activeSessions = await prisma.userSession.count({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (activeSessions >= this.MAX_CONCURRENT_SESSIONS) {
      // Remove oldest sessions
      const oldestSessions = await prisma.userSession.findMany({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'asc' },
        take: activeSessions - this.MAX_CONCURRENT_SESSIONS + 1,
      });

      await prisma.userSession.updateMany({
        where: {
          id: { in: oldestSessions.map(s => s.id) },
        },
        data: { isActive: false },
      });
    }
  }

  /**
   * Get session statistics for admin dashboard
   */
  static async getSessionStats(): Promise<{
    totalActiveSessions: number;
    totalUsers: number;
    averageSessionsPerUser: number;
  }> {
    const [totalActiveSessions, totalUsers] = await Promise.all([
      prisma.userSession.count({
        where: {
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      }),
      prisma.user.count(),
    ]);

    return {
      totalActiveSessions,
      totalUsers,
      averageSessionsPerUser: totalUsers > 0 ? totalActiveSessions / totalUsers : 0,
    };
  }
}

