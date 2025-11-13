import { prisma } from '@/lib/prisma';

/**
 * Password expiration configuration
 */
export const PASSWORD_EXPIRATION_CONFIG = {
  DEFAULT_EXPIRATION_DAYS: 90, // Default: passwords expire after 90 days
  WARNING_DAYS_BEFORE_EXPIRATION: 7, // Show warning 7 days before expiration
  FORCE_CHANGE_ON_EXPIRATION: true, // Force password change when expired
} as const;

/**
 * Get password expiration policy from system settings
 */
export async function getPasswordExpirationPolicy(): Promise<{
  expirationDays: number;
  warningDays: number;
  forceChange: boolean;
  enabled: boolean;
}> {
  try {
    const [expirationSetting, warningSetting, forceChangeSetting, enabledSetting] = await Promise.all([
      prisma.systemSettings.findUnique({
        where: {
          category_key: {
            category: 'security',
            key: 'PASSWORD_EXPIRATION_DAYS',
          },
        },
      }),
      prisma.systemSettings.findUnique({
        where: {
          category_key: {
            category: 'security',
            key: 'PASSWORD_EXPIRATION_WARNING_DAYS',
          },
        },
      }),
      prisma.systemSettings.findUnique({
        where: {
          category_key: {
            category: 'security',
            key: 'PASSWORD_EXPIRATION_FORCE_CHANGE',
          },
        },
      }),
      prisma.systemSettings.findUnique({
        where: {
          category_key: {
            category: 'security',
            key: 'PASSWORD_EXPIRATION_ENABLED',
          },
        },
      }),
    ]);

    const enabled = enabledSetting?.value === 'true';
    const expirationDays = enabled
      ? parseInt(expirationSetting?.value || String(PASSWORD_EXPIRATION_CONFIG.DEFAULT_EXPIRATION_DAYS))
      : 0;
    const warningDays = parseInt(
      warningSetting?.value || String(PASSWORD_EXPIRATION_CONFIG.WARNING_DAYS_BEFORE_EXPIRATION)
    );
    const forceChange = forceChangeSetting?.value !== 'false'; // Default to true

    return {
      expirationDays,
      warningDays,
      forceChange,
      enabled,
    };
  } catch (error) {
    console.error('Error fetching password expiration policy:', error);
    // Return defaults if error
    return {
      expirationDays: PASSWORD_EXPIRATION_CONFIG.DEFAULT_EXPIRATION_DAYS,
      warningDays: PASSWORD_EXPIRATION_CONFIG.WARNING_DAYS_BEFORE_EXPIRATION,
      forceChange: PASSWORD_EXPIRATION_CONFIG.FORCE_CHANGE_ON_EXPIRATION,
      enabled: false,
    };
  }
}

/**
 * Calculate password expiration date based on policy
 */
export async function calculatePasswordExpirationDate(
  passwordChangedAt: Date | null
): Promise<Date | null> {
  const policy = await getPasswordExpirationPolicy();

  if (!policy.enabled || policy.expirationDays === 0) {
    return null;
  }

  const baseDate = passwordChangedAt || new Date();
  const expirationDate = new Date(baseDate);
  expirationDate.setDate(expirationDate.getDate() + policy.expirationDays);

  return expirationDate;
}

/**
 * Check if password is expired
 */
export async function isPasswordExpired(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      passwordExpired: true,
      passwordExpiresAt: true,
      passwordChangedAt: true,
    },
  });

  if (!user) {
    return false;
  }

  // If explicitly marked as expired
  if (user.passwordExpired) {
    return true;
  }

  // Check expiration date
  if (user.passwordExpiresAt && user.passwordExpiresAt <= new Date()) {
    // Update the expired flag
    await prisma.user.update({
      where: { id: userId },
      data: { passwordExpired: true },
    });
    return true;
  }

  // Recalculate expiration if passwordChangedAt exists but passwordExpiresAt doesn't
  if (user.passwordChangedAt && !user.passwordExpiresAt) {
    const expirationDate = await calculatePasswordExpirationDate(user.passwordChangedAt);
    if (expirationDate && expirationDate <= new Date()) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordExpired: true,
          passwordExpiresAt: expirationDate,
        },
      });
      return true;
    }
  }

  return false;
}

/**
 * Get password expiration status
 */
export async function getPasswordExpirationStatus(userId: string): Promise<{
  isExpired: boolean;
  expiresAt: Date | null;
  daysUntilExpiration: number | null;
  daysUntilWarning: number | null;
  isWarningActive: boolean;
  passwordChangedAt: Date | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      passwordExpired: true,
      passwordExpiresAt: true,
      passwordChangedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const policy = await getPasswordExpirationPolicy();

  // If policy is disabled, return no expiration
  if (!policy.enabled) {
    return {
      isExpired: false,
      expiresAt: null,
      daysUntilExpiration: null,
      daysUntilWarning: null,
      isWarningActive: false,
      passwordChangedAt: user.passwordChangedAt,
    };
  }

  // Calculate expiration date if not set
  let expiresAt = user.passwordExpiresAt;
  if (!expiresAt && user.passwordChangedAt) {
    expiresAt = await calculatePasswordExpirationDate(user.passwordChangedAt);
    if (expiresAt) {
      await prisma.user.update({
        where: { id: userId },
        data: { passwordExpiresAt: expiresAt },
      });
    }
  }

  const now = new Date();
  const isExpired = user.passwordExpired || (expiresAt ? expiresAt <= now : false);

  let daysUntilExpiration: number | null = null;
  let daysUntilWarning: number | null = null;
  let isWarningActive = false;

  if (expiresAt && !isExpired) {
    const diffMs = expiresAt.getTime() - now.getTime();
    daysUntilExpiration = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    daysUntilWarning = daysUntilExpiration - policy.warningDays;
    isWarningActive = daysUntilExpiration <= policy.warningDays;
  }

  return {
    isExpired,
    expiresAt,
    daysUntilExpiration,
    daysUntilWarning,
    isWarningActive,
    passwordChangedAt: user.passwordChangedAt,
  };
}

/**
 * Update password expiration after password change
 */
export async function updatePasswordExpiration(userId: string): Promise<void> {
  const policy = await getPasswordExpirationPolicy();
  const now = new Date();

  if (!policy.enabled) {
    // If disabled, clear expiration fields
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordChangedAt: now,
        passwordExpiresAt: null,
        passwordExpired: false,
      },
    });
    return;
  }

  const expirationDate = await calculatePasswordExpirationDate(now);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordChangedAt: now,
      passwordExpiresAt: expirationDate,
      passwordExpired: false,
    },
  });
}

/**
 * Initialize password expiration for existing users
 */
export async function initializePasswordExpirationForUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      passwordChangedAt: true,
      passwordExpiresAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    return;
  }

  // If passwordChangedAt is not set, use createdAt as fallback
  const baseDate = user.passwordChangedAt || user.createdAt;
  const expirationDate = await calculatePasswordExpirationDate(baseDate);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordChangedAt: user.passwordChangedAt || user.createdAt,
      passwordExpiresAt: expirationDate,
      passwordExpired: expirationDate ? expirationDate <= new Date() : false,
    },
  });
}

