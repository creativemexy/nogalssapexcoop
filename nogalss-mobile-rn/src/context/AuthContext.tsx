import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { BiometricService } from '../services/biometric';
import { NotificationService } from '../services/notifications';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  cooperativeId?: string | null;
  businessId?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, totp?: string) => Promise<void>;
  loginWithBiometric: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  biometricAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    // Check for stored user on app start
    const checkAuth = async () => {
      try {
        // Check biometric availability
        const available = await BiometricService.isAvailable();
        setBiometricAvailable(available);

        // Check if biometric login is enabled
        const biometricEnabled = await BiometricService.isBiometricEnabled();
        if (biometricEnabled && available) {
          // Don't auto-login with biometric, let user choose
          // Just check if we have stored credentials
          const storedUser = await apiService.getStoredUser();
          const token = await apiService.getStoredToken();
          if (storedUser && token) {
            // User has credentials but we'll wait for biometric prompt
            setUser(null); // Don't auto-login, require biometric
          }
        } else {
          // Normal auth check
          const storedUser = await apiService.getStoredUser();
          const token = await apiService.getStoredToken();
          if (storedUser && token) {
            setUser(storedUser);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, totp?: string) => {
    try {
      const response = await apiService.login(email, password, totp);
      setUser(response.user);
      
      // After successful login, update biometric credentials if enabled
      const biometricEnabled = await BiometricService.isBiometricEnabled();
      if (biometricEnabled) {
        // Update stored credentials for biometric login
        await BiometricService.updateBiometricCredentials(
          response.token,
          response.user
        );
      }

      // Register for push notifications after successful login
      try {
        await NotificationService.registerForPushNotifications();
      } catch (error) {
        console.warn('Failed to register for push notifications:', error);
        // Don't fail login if notification registration fails
      }
    } catch (error: any) {
      throw error;
    }
  };

  const loginWithBiometric = async () => {
    try {
      // Check if biometric is enabled
      const biometricEnabled = await BiometricService.isBiometricEnabled();
      if (!biometricEnabled) {
        throw new Error('Biometric authentication is not enabled');
      }

      // Get the email associated with biometric
      const email = await BiometricService.getBiometricEmail();
      if (!email) {
        throw new Error('No email found for biometric login');
      }

      // Authenticate with biometric
      const result = await BiometricService.authenticate('Authenticate to login');
      if (!result.success) {
        throw new Error(result.error || 'Biometric authentication failed');
      }

      // Get stored biometric credentials
      const { token, user } = await BiometricService.getBiometricCredentials();
      
      if (user && token) {
        // Verify the email matches
        if (user.email === email) {
          // Restore credentials to regular storage
          await apiService.setStoredCredentials(token, user);
          setUser(user);
        } else {
          throw new Error('Biometric email does not match stored user');
        }
      } else {
        throw new Error('No stored credentials found. Please login with password first to enable biometric login.');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Unregister push token
      try {
        await NotificationService.unregisterPushToken();
      } catch (error) {
        console.warn('Failed to unregister push token:', error);
      }

      // Clear auth data first
      await apiService.logout();
      
      // Optionally clear biometric (user can choose to keep it)
      // await BiometricService.disableBiometric();
      
      // Clear user state immediately - this triggers navigation reset
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error('Error in logout:', error);
      // Still clear user state even if API call fails
      setUser(null);
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    loginWithBiometric,
    logout,
    isAuthenticated: !!user,
    biometricAvailable,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

