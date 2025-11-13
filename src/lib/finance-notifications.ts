import { prisma } from '@/lib/prisma';

/**
 * Notify all finance users about a new withdrawal request
 */
export async function notifyFinanceUsersOfWithdrawal(withdrawal: {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  status: string;
}) {
  try {
    // Get user details for the withdrawal request
    const user = await prisma.user.findUnique({
      where: { id: withdrawal.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      console.error('User not found for withdrawal notification:', withdrawal.userId);
      return;
    }

    // Get all finance users
    const financeUsers = await prisma.user.findMany({
      where: {
        role: 'FINANCE',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (financeUsers.length === 0) {
      console.warn('No finance users found to notify about withdrawal');
      return;
    }

    // Format amount (convert from kobo to naira)
    const amountInNaira = withdrawal.amount / 100;
    const userRole = user.role || 'User';
    const userName = `${user.firstName} ${user.lastName}`;

    // Create notifications for all finance users
    const notifications = await Promise.all(
      financeUsers.map((financeUser) =>
        prisma.inAppNotification.create({
          data: {
            userId: financeUser.id,
            type: 'WITHDRAWAL_REQUEST',
            title: `New Withdrawal Request - ${userRole}`,
            message: `${userName} (${user.email}) has requested a withdrawal of ₦${amountInNaira.toLocaleString()}. Reason: ${withdrawal.reason}`,
            relatedId: withdrawal.id,
            relatedType: 'WITHDRAWAL',
            metadata: {
              withdrawalId: withdrawal.id,
              userId: withdrawal.userId,
              userName,
              userEmail: user.email,
              userRole,
              amount: amountInNaira,
              reason: withdrawal.reason,
            },
          },
        })
      )
    );

    console.log(`✅ Created ${notifications.length} notifications for finance users about withdrawal ${withdrawal.id}`);

    return notifications;
  } catch (error) {
    console.error('Error notifying finance users of withdrawal:', error);
    // Don't throw - we don't want to break the withdrawal creation if notification fails
  }
}

