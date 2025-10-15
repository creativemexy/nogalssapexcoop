import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Type definitions for secure role validation
export interface SecureUser {
  id: string;
  email: string;
  role: UserRole;
  cooperativeId?: string | null;
  leaderId?: string | null;
  apexId?: string | null;
  businessId?: string | null;
}

export type UserRole = 
  | 'SUPER_ADMIN'
  | 'APEX'
  | 'LEADER'
  | 'COOPERATIVE'
  | 'MEMBER'
  | 'BUSINESS'
  | 'FINANCE'
  | 'APEX_FUNDS'
  | 'NOGALSS_FUNDS'
  | 'PARENT_ORGANIZATION';

// Role hierarchy for privilege validation
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  APEX: 80,
  FINANCE: 70,
  APEX_FUNDS: 60,
  NOGALSS_FUNDS: 50,
  PARENT_ORGANIZATION: 45,
  LEADER: 40,
  COOPERATIVE: 30,
  BUSINESS: 20,
  MEMBER: 10,
};

// Type guard for secure user validation
export function isValidUser(user: any): user is SecureUser {
  return (
    user &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.role === 'string' &&
    Object.keys(ROLE_HIERARCHY).includes(user.role)
  );
}

// Role validation utilities
export function hasRole(user: SecureUser, requiredRole: UserRole): boolean {
  return user.role === requiredRole;
}

export function hasMinimumRole(user: SecureUser, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minimumRole];
}

export function isSuperAdmin(user: SecureUser): boolean {
  return user.role === 'SUPER_ADMIN';
}

export function canAccessResource(user: SecureUser, resourceOwnerId?: string): boolean {
  // Super admin can access everything
  if (isSuperAdmin(user)) return true;
  
  // Users can only access their own resources
  return user.id === resourceOwnerId;
}

// Secure session validation - to be used in API routes, not middleware
export function validateSecureUser(user: any): SecureUser | null {
  if (!user) {
    return null;
  }

  // Validate session user structure
  if (!isValidUser(user)) {
    console.error('Invalid session user structure:', user);
    return null;
  }

  return user as SecureUser;
}

// API route security wrapper - requires session to be passed from API route
export function requireAuthFromSession(
  sessionUser: any,
  requiredRole?: UserRole,
  minimumRole?: UserRole
): { user: SecureUser } | { error: Response } {
  const user = validateSecureUser(sessionUser);
  
  if (!user) {
    return { error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) };
  }

  if (requiredRole && !hasRole(user, requiredRole)) {
    return { error: new Response(JSON.stringify({ error: 'Insufficient privileges' }), { status: 403 }) };
  }

  if (minimumRole && !hasMinimumRole(user, minimumRole)) {
    return { error: new Response(JSON.stringify({ error: 'Insufficient privileges' }), { status: 403 }) };
  }

  return { user };
}

// API route security wrapper for multiple roles
export function requireAuthFromSessionWithRoles(
  sessionUser: any,
  allowedRoles: UserRole[]
): { user: SecureUser } | { error: Response } {
  const user = validateSecureUser(sessionUser);
  
  if (!user) {
    return { error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) };
  }

  if (!allowedRoles.includes(user.role)) {
    return { error: new Response(JSON.stringify({ error: 'Insufficient privileges' }), { status: 403 }) };
  }

  return { user };
}

// Audit logging for security events
export async function logSecurityEvent(
  userId: string,
  action: string,
  details: Record<string, any> = {},
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const actionWithDetails = `[${severity}] ${action}${Object.keys(details).length > 0 ? ` - ${JSON.stringify(details)}` : ''}`;
    
    await prisma.log.create({
      data: {
        userId,
        userEmail: user?.email || 'unknown',
        action: actionWithDetails,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Impersonation audit logging
export async function logImpersonationEvent(
  adminUserId: string,
  targetUserId: string,
  action: 'START' | 'STOP',
  details: Record<string, any> = {}
): Promise<void> {
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  
  await logSecurityEvent(
    adminUserId,
    `IMPERSONATION_${action}`,
    {
      targetUserId,
      targetUserEmail: targetUser?.email,
      timestamp: new Date().toISOString(),
      ...details,
    },
    'CRITICAL'
  );
}

// Rate limiting storage (in-memory for now, can be moved to Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // Create new record
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  // Increment count
  record.count++;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: limit - record.count,
    resetTime: record.resetTime,
  };
}

// Clean up expired rate limit records
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  rateLimitStore.forEach((record, key) => {
    if (now > record.resetTime) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}, 5 * 60 * 1000); // Clean up every 5 minutes
