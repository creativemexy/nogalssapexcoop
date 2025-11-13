import { prisma } from '@/lib/prisma';

/**
 * Account lockout configuration
 */
export const ACCOUNT_LOCKOUT_CONFIG = {
  MAX_FAILED_ATTEMPTS: 5, // Lock after 5 failed attempts
  LOCKOUT_DURATION_MINUTES: 30, // Lock for 30 minutes
  RESET_ATTEMPTS_AFTER_MINUTES: 15, // Reset attempt counter after 15 minutes of no attempts
} as const;

/**
 * Check if an account is currently locked
 */
export async function isAccountLocked(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accountLockedUntil: true,
      failedLoginAttempts: true,
    },
  });

  if (!user) {
    return false;
  }

  // Check if account is locked and lockout hasn't expired
  if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
    return true;
  }

  // If lockout expired, clear it
  if (user.accountLockedUntil && user.accountLockedUntil <= new Date()) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        accountLockedUntil: null,
        failedLoginAttempts: 0,
      },
    });
    return false;
  }

  return false;
}

/**
 * Get remaining lockout time in minutes
 */
export async function getRemainingLockoutTime(userId: string): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accountLockedUntil: true,
    },
  });

  if (!user || !user.accountLockedUntil) {
    return null;
  }

  const now = new Date();
  if (user.accountLockedUntil <= now) {
    return null;
  }

  const diffMs = user.accountLockedUntil.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60)); // Convert to minutes
}

/**
 * Record a failed login attempt
 */
export async function recordFailedLoginAttempt(userId: string): Promise<{
  isLocked: boolean;
  remainingAttempts: number;
  lockoutUntil?: Date;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      failedLoginAttempts: true,
      lastFailedLoginAttempt: true,
      accountLockedUntil: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const now = new Date();
  let newFailedAttempts = user.failedLoginAttempts + 1;

  // Reset attempts if enough time has passed since last failed attempt
  if (
    user.lastFailedLoginAttempt &&
    now.getTime() - user.lastFailedLoginAttempt.getTime() >
      ACCOUNT_LOCKOUT_CONFIG.RESET_ATTEMPTS_AFTER_MINUTES * 60 * 1000
  ) {
    newFailedAttempts = 1;
  }

  // Check if we should lock the account
  const shouldLock = newFailedAttempts >= ACCOUNT_LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS;
  const lockoutUntil = shouldLock
    ? new Date(now.getTime() + ACCOUNT_LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000)
    : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: newFailedAttempts,
      lastFailedLoginAttempt: now,
      accountLockedUntil: lockoutUntil,
    },
  });

  return {
    isLocked: shouldLock,
    remainingAttempts: Math.max(0, ACCOUNT_LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS - newFailedAttempts),
    lockoutUntil: lockoutUntil || undefined,
  };
}

/**
 * Reset failed login attempts (called on successful login)
 */
export async function resetFailedLoginAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lastFailedLoginAttempt: null,
      accountLockedUntil: null,
    },
  });
}

/**
 * Manually unlock an account (admin function)
 */
export async function unlockAccount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lastFailedLoginAttempt: null,
      accountLockedUntil: null,
    },
  });
}

/**
 * Get account lockout status
 */
export async function getAccountLockoutStatus(userId: string): Promise<{
  isLocked: boolean;
  failedAttempts: number;
  lockoutUntil: Date | null;
  remainingAttempts: number;
  remainingLockoutMinutes: number | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      failedLoginAttempts: true,
      accountLockedUntil: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isLocked = user.accountLockedUntil ? user.accountLockedUntil > new Date() : false;
  const remainingLockoutMinutes = await getRemainingLockoutTime(userId);
  const remainingAttempts = Math.max(
    0,
    ACCOUNT_LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS - user.failedLoginAttempts
  );

  return {
    isLocked,
    failedAttempts: user.failedLoginAttempts,
    lockoutUntil: user.accountLockedUntil,
    remainingAttempts,
    remainingLockoutMinutes,
  };
}

