import { prisma } from '@/lib/prisma';
import * as Notifications from 'expo-server-sdk';

// Initialize Expo SDK
const expo = new Notifications.Expo();

interface PushNotificationPayload {
  to: string; // Expo push token
  sound?: 'default' | null;
  title: string;
  body: string;
  data?: any;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string; // Android channel ID
}

/**
 * Send push notification to a single device
 */
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  try {
    if (!Notifications.Expo.isExpoPushToken(expoPushToken)) {
      console.error('Invalid Expo push token:', expoPushToken);
      return false;
    }

    const message: PushNotificationPayload = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
      priority: 'high',
    };

    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    // Check for errors
    const errors = tickets
      .map((ticket, i) => {
        if (ticket.status === 'error') {
          return { index: i, error: ticket.message };
        }
        return null;
      })
      .filter(Boolean);

    if (errors.length > 0) {
      console.error('Push notification errors:', errors);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Send push notification to a user by user ID
 */
export async function sendPushNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  try {
    // Get user's active devices
    const devices = await prisma.device.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        expoPushToken: true,
      },
    });

    if (devices.length === 0) {
      console.warn('No active devices found for user:', userId);
      return false;
    }

    // Send notification to all active devices
    const results = await Promise.all(
      devices.map((device) =>
        sendPushNotification(device.expoPushToken, title, body, data)
      )
    );

    return results.some((result) => result === true);
  } catch (error) {
    console.error('Error sending push notification to user:', error);
    return false;
  }
}

/**
 * Send push notification for loan approval
 */
export async function notifyLoanApproval(
  userId: string,
  loanId: string,
  amount: number
): Promise<void> {
  const title = 'Loan Approved! 🎉';
  const body = `Your loan application of ₦${(amount / 100).toLocaleString()} has been approved.`;
  const data = {
    type: 'LOAN_APPROVAL',
    loanId,
    amount,
  };

  await sendPushNotificationToUser(userId, title, body, data);
}

/**
 * Send push notification for loan rejection
 */
export async function notifyLoanRejection(
  userId: string,
  loanId: string,
  reason?: string
): Promise<void> {
  const title = 'Loan Application Update';
  const body = reason
    ? `Your loan application was not approved. Reason: ${reason}`
    : 'Your loan application was not approved.';
  const data = {
    type: 'LOAN_REJECTION',
    loanId,
    reason,
  };

  await sendPushNotificationToUser(userId, title, body, data);
}

/**
 * Send push notification for contribution confirmation
 */
export async function notifyContributionConfirmation(
  userId: string,
  amount: number,
  reference: string
): Promise<void> {
  const title = 'Contribution Confirmed ✅';
  const body = `Your contribution of ₦${(amount / 100).toLocaleString()} has been confirmed.`;
  const data = {
    type: 'CONTRIBUTION_CONFIRMATION',
    amount,
    reference,
  };

  await sendPushNotificationToUser(userId, title, body, data);
}

/**
 * Send push notification for payment alert
 */
export async function notifyPaymentAlert(
  userId: string,
  amount: number,
  type: string,
  status: string
): Promise<void> {
  const title = status === 'SUCCESSFUL' ? 'Payment Successful ✅' : 'Payment Failed ❌';
  const body = `Your ${type.toLowerCase()} payment of ₦${(amount / 100).toLocaleString()} was ${status.toLowerCase()}.`;
  const data = {
    type: 'PAYMENT_ALERT',
    amount,
    paymentType: type,
    status,
  };

  await sendPushNotificationToUser(userId, title, body, data);
}

/**
 * Send push notification for withdrawal approval
 */
export async function notifyWithdrawalApproval(
  userId: string,
  amount: number,
  withdrawalId: string
): Promise<void> {
  const title = 'Withdrawal Approved ✅';
  const body = `Your withdrawal request of ₦${(amount / 100).toLocaleString()} has been approved.`;
  const data = {
    type: 'WITHDRAWAL_APPROVAL',
    amount,
    withdrawalId,
  };

  await sendPushNotificationToUser(userId, title, body, data);
}

/**
 * Send push notification for withdrawal rejection
 */
export async function notifyWithdrawalRejection(
  userId: string,
  amount: number,
  withdrawalId: string,
  reason?: string
): Promise<void> {
  const title = 'Withdrawal Request Update';
  const body = reason
    ? `Your withdrawal request of ₦${(amount / 100).toLocaleString()} was not approved. Reason: ${reason}`
    : `Your withdrawal request of ₦${(amount / 100).toLocaleString()} was not approved.`;
  const data = {
    type: 'WITHDRAWAL_REJECTION',
    amount,
    withdrawalId,
    reason,
  };

  await sendPushNotificationToUser(userId, title, body, data);
}

