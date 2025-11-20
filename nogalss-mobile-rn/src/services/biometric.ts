import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = '@nogalss_biometric_enabled';
const BIOMETRIC_EMAIL_KEY = '@nogalss_biometric_email';
const BIOMETRIC_TOKEN_KEY = '@nogalss_biometric_token';
const BIOMETRIC_USER_KEY = '@nogalss_biometric_user';

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometricType?: 'fingerprint' | 'facial' | 'iris' | 'none';
}

export class BiometricService {
  /**
   * Check if biometric authentication is available on the device
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return false;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Get the type of biometric authentication available
   */
  static async getBiometricType(): Promise<'fingerprint' | 'facial' | 'iris' | 'none'> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'facial';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'iris';
      }
      return 'none';
    } catch (error) {
      console.error('Error getting biometric type:', error);
      return 'none';
    }
  }

  /**
   * Authenticate using biometrics
   */
  static async authenticate(
    reason: string = 'Authenticate to login'
  ): Promise<BiometricResult> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false, // Allow device PIN/password as fallback
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        const biometricType = await this.getBiometricType();
        return {
          success: true,
          biometricType,
        };
      } else {
        // Handle different failure cases
        const errorMessage = 
          (result as any).error === 'user_cancel' ? 'Authentication cancelled' :
          (result as any).error === 'user_fallback' ? 'User chose to use password' :
          (result as any).error === 'system_cancel' ? 'Authentication cancelled by system' :
          (result as any).error === 'passcode_not_set' ? 'Device passcode not set' :
          (result as any).error === 'not_available' ? 'Biometric authentication not available' :
          (result as any).error === 'not_enrolled' ? 'No biometrics enrolled' :
          'Authentication failed';
        
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Biometric authentication error',
      };
    }
  }

  /**
   * Enable biometric authentication for a user
   * Also stores credentials for biometric login
   */
  static async enableBiometric(email: string, token?: string, user?: any): Promise<void> {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      await AsyncStorage.setItem(BIOMETRIC_EMAIL_KEY, email);
      
      // Store credentials for biometric login (if provided)
      if (token) {
        await AsyncStorage.setItem(BIOMETRIC_TOKEN_KEY, token);
      }
      if (user) {
        await AsyncStorage.setItem(BIOMETRIC_USER_KEY, JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw error;
    }
  }

  /**
   * Disable biometric authentication
   */
  static async disableBiometric(): Promise<void> {
    try {
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_EMAIL_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_TOKEN_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_USER_KEY);
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw error;
    }
  }

  /**
   * Get stored credentials for biometric login
   */
  static async getBiometricCredentials(): Promise<{ token: string | null; user: any | null }> {
    try {
      const token = await AsyncStorage.getItem(BIOMETRIC_TOKEN_KEY);
      const userStr = await AsyncStorage.getItem(BIOMETRIC_USER_KEY);
      const user = userStr ? JSON.parse(userStr) : null;
      return { token, user };
    } catch (error) {
      console.error('Error getting biometric credentials:', error);
      return { token: null, user: null };
    }
  }

  /**
   * Update stored credentials for biometric login
   */
  static async updateBiometricCredentials(token: string, user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(BIOMETRIC_TOKEN_KEY, token);
      await AsyncStorage.setItem(BIOMETRIC_USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error updating biometric credentials:', error);
      throw error;
    }
  }

  /**
   * Check if biometric authentication is enabled
   */
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric status:', error);
      return false;
    }
  }

  /**
   * Get the email associated with biometric authentication
   */
  static async getBiometricEmail(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(BIOMETRIC_EMAIL_KEY);
    } catch (error) {
      console.error('Error getting biometric email:', error);
      return null;
    }
  }

  /**
   * Get user-friendly name for biometric type
   */
  static getBiometricTypeName(type: 'fingerprint' | 'facial' | 'iris' | 'none'): string {
    switch (type) {
      case 'fingerprint':
        return 'Fingerprint';
      case 'facial':
        return 'Face ID';
      case 'iris':
        return 'Iris';
      default:
        return 'Biometric';
    }
  }
}

