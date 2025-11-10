import { prisma } from '@/lib/prisma';

/**
 * Check if withdrawals are enabled for a specific user role
 * @param role - The user role to check
 * @returns Promise<boolean> - true if withdrawals are enabled, false otherwise
 */
export async function isWithdrawalEnabled(role: string): Promise<boolean> {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: {
        category_key: {
          category: 'withdrawal',
          key: `${role}_WITHDRAWAL_ENABLED`,
        },
      },
    });
    
    // Default to disabled (false) if not set
    return setting?.value === 'true';
  } catch (error) {
    console.error('Error checking withdrawal permission:', error);
    // Default to disabled on error
    return false;
  }
}

