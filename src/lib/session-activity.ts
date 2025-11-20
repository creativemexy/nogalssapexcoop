import { prisma } from '@/lib/prisma';

export type ActivityAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'PAGE_VIEW'
  | 'API_CALL'
  | 'PASSWORD_CHANGE'
  | 'PROFILE_UPDATE'
  | 'WITHDRAWAL_REQUEST'
  | 'PAYMENT_INITIATED'
  | 'SENSITIVE_ACTION'
  | 'SUSPICIOUS_ACTIVITY';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ActivityMetadata {
  [key: string]: any;
  requestBody?: any;
  responseStatus?: number;
  errorMessage?: string;
  duration?: number; // milliseconds
  userAgent?: string;
  referer?: string;
}

/**
 * Log session activity
 */
export async function logSessionActivity(params: {
  sessionId: string;
  userId: string;
  action: ActivityAction;
  resource?: string;
  method?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: ActivityMetadata;
  riskLevel?: RiskLevel;
}): Promise<void> {
  try {
    // Update session's last activity timestamp
    await prisma.userSession.updateMany({
      where: {
        sessionId: params.sessionId,
        isActive: true,
      },
      data: {
        lastActivityAt: new Date(),
      },
    });

    // Determine risk level if not provided
    let riskLevel: RiskLevel = params.riskLevel || 'LOW';
    if (!params.riskLevel) {
      riskLevel = determineRiskLevel(params.action, params.resource, params.metadata);
    }

    // Log the activity
    await prisma.sessionActivity.create({
      data: {
        sessionId: params.sessionId,
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        method: params.method,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata || {},
        riskLevel,
      },
    });
  } catch (error) {
    // Don't throw - activity logging should not break the application
    console.error('Failed to log session activity:', error);
  }
}

/**
 * Determine risk level based on action and context
 */
function determineRiskLevel(
  action: ActivityAction,
  resource?: string,
  metadata?: ActivityMetadata
): RiskLevel {
  // Critical actions
  if (
    action === 'PASSWORD_CHANGE' ||
    action === 'WITHDRAWAL_REQUEST' ||
    action === 'SUSPICIOUS_ACTIVITY' ||
    action === 'SENSITIVE_ACTION'
  ) {
    return 'CRITICAL';
  }

  // High risk actions
  if (action === 'PAYMENT_INITIATED' || action === 'PROFILE_UPDATE') {
    return 'HIGH';
  }

  // Check for suspicious patterns
  if (metadata) {
    // Failed API calls might indicate probing
    if (metadata.responseStatus && metadata.responseStatus >= 400 && metadata.responseStatus < 500) {
      return 'MEDIUM';
    }

    // Server errors might indicate issues
    if (metadata.responseStatus && metadata.responseStatus >= 500) {
      return 'LOW'; // System issue, not user risk
    }

    // Long duration might indicate suspicious activity
    if (metadata.duration && metadata.duration > 30000) {
      return 'MEDIUM';
    }
  }

  // Check resource patterns
  if (resource) {
    const sensitiveResources = [
      '/api/admin',
      '/api/payments',
      '/api/withdraw',
      '/dashboard/admin',
      '/dashboard/super-admin',
    ];

    if (sensitiveResources.some(pattern => resource.includes(pattern))) {
      return 'HIGH';
    }
  }

  return 'LOW';
}

/**
 * Get recent activities for a session
 */
export async function getSessionActivities(params: {
  sessionId?: string;
  userId?: string;
  limit?: number;
  riskLevel?: RiskLevel;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {};

  if (params.sessionId) {
    where.sessionId = params.sessionId;
  }

  if (params.userId) {
    where.userId = params.userId;
  }

  if (params.riskLevel) {
    where.riskLevel = params.riskLevel;
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) {
      where.createdAt.gte = params.startDate;
    }
    if (params.endDate) {
      where.createdAt.lte = params.endDate;
    }
  }

  return await prisma.sessionActivity.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: params.limit || 100,
    include: {
      session: {
        select: {
          id: true,
          ipAddress: true,
          userAgent: true,
          lastActivityAt: true,
        },
      },
    },
  });
}

/**
 * Get activity statistics
 */
export async function getActivityStats(params: {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {};

  if (params.userId) {
    where.userId = params.userId;
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) {
      where.createdAt.gte = params.startDate;
    }
    if (params.endDate) {
      where.createdAt.lte = params.endDate;
    }
  }

  const [total, byRiskLevel, byAction, recentCritical] = await Promise.all([
    prisma.sessionActivity.count({ where }),
    prisma.sessionActivity.groupBy({
      by: ['riskLevel'],
      where,
      _count: true,
    }),
    prisma.sessionActivity.groupBy({
      by: ['action'],
      where,
      _count: true,
    }),
    prisma.sessionActivity.findMany({
      where: {
        ...where,
        riskLevel: 'CRITICAL',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        session: {
          select: {
            ipAddress: true,
            userAgent: true,
          },
        },
      },
    }),
  ]);

  return {
    total,
    byRiskLevel: byRiskLevel.reduce((acc, item) => {
      acc[item.riskLevel] = item._count;
      return acc;
    }, {} as Record<string, number>),
    byAction: byAction.reduce((acc, item) => {
      acc[item.action] = item._count;
      return acc;
    }, {} as Record<string, number>),
    recentCritical,
  };
}

/**
 * Update session last activity timestamp
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  try {
    await prisma.userSession.updateMany({
      where: {
        sessionId,
        isActive: true,
      },
      data: {
        lastActivityAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to update session activity:', error);
  }
}

