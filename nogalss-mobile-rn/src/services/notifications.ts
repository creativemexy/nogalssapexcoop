import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const EXPO_PUSH_TOKEN_KEY = '@nogalss_expo_push_token';
const NOTIFICATION_PERMISSION_KEY = '@nogalss_notification_permission';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationData {
  type: 'LOAN_APPROVAL' | 'LOAN_REJECTION' | 'CONTRIBUTION_CONFIRMATION' | 'PAYMENT_ALERT' | 'WITHDRAWAL_APPROVAL' | 'WITHDRAWAL_REJECTION' | 'GENERAL';
  title: string;
  body: string;
  data?: any;
  userId?: string;
}

export class NotificationService {
  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'denied');
        return false;
      }

      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get Expo push token
   */
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Get existing token
      const existingToken = await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
      if (existingToken) {
        return existingToken;
      }

      // Register for push notifications
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'nogalss-mobile', // From app.json extra.eas.projectId
      });

      const token = tokenData.data;
      
      // Store token locally
      await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);

      // Send token to backend
      await this.sendTokenToBackend(token);

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Send push token to backend
   */
  static async sendTokenToBackend(token: string): Promise<void> {
    try {
      const userToken = await this.getAuthToken();
      if (!userToken) {
        console.warn('No auth token found, cannot register push token');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/mobile/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          expoPushToken: token,
          platform: Platform.OS,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to register push token: ${response.status}`);
      }

      console.log('Push token registered successfully');
    } catch (error) {
      console.error('Error sending push token to backend:', error);
    }
  }

  /**
   * Get stored auth token
   */
  private static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@nogalss_token');
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current push token
   */
  static async getPushToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  /**
   * Unregister push token
   */
  static async unregisterPushToken(): Promise<void> {
    try {
      const token = await this.getPushToken();
      if (token) {
        const userToken = await this.getAuthToken();
        if (userToken) {
          await fetch(`${API_BASE_URL}/api/mobile/push-token`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify({ expoPushToken: token }),
          });
        }
      }

      await AsyncStorage.removeItem(EXPO_PUSH_TOKEN_KEY);
    } catch (error) {
      console.error('Error unregistering push token:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  static setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
  ) {
    // Listener for notifications received while app is foregrounded
    const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listener for when user taps on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    });

    return {
      remove: () => {
        receivedListener.remove();
        responseListener.remove();
      },
    };
  }

  /**
   * Schedule a local notification (for testing or offline use)
   * Note: This is mainly for testing. Production notifications come from the server.
   */
  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    seconds: number = 0
  ): Promise<string> {
    try {
      const content = {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      };

      // Build notification config
      const notificationConfig: Parameters<typeof Notifications.scheduleNotificationAsync>[0] = {
        content,
        trigger: seconds > 0 
          ? (new Date(Date.now() + seconds * 1000) as unknown as Notifications.NotificationTriggerInput)
          : null,
      };

      const identifier = await Notifications.scheduleNotificationAsync(notificationConfig);

      return identifier;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  /**
   * Get notification permissions status
   */
  static async getPermissionStatus(): Promise<Notifications.PermissionStatus> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Error getting permission status:', error);
      // Return the default undetermined status
      return 'undetermined' as Notifications.PermissionStatus;
    }
  }

  /**
   * Set badge count
   */
  static async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Clear badge count
   */
  static async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  }
}

