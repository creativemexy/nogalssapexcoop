import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { BiometricService } from '../services/biometric';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'facial' | 'iris' | 'none'>('none');
  const { login, loginWithBiometric, biometricAvailable: contextBiometricAvailable } = useAuth();

  useEffect(() => {
    const checkBiometric = async () => {
      const available = await BiometricService.isAvailable();
      setBiometricAvailable(available);
      
      if (available) {
        const type = await BiometricService.getBiometricType();
        setBiometricType(type);
        const enabled = await BiometricService.isBiometricEnabled();
        setBiometricEnabled(enabled);
      }
    };
    
    checkBiometric();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email/phone/NIN and password');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password, totp || undefined);
      
      // After successful login, prompt to enable biometric if available
      if (biometricAvailable && !biometricEnabled) {
        const biometricTypeName = BiometricService.getBiometricTypeName(biometricType);
        Alert.alert(
          'Enable Biometric Login?',
          `Would you like to enable ${biometricTypeName} for faster login?`,
          [
            {
              text: 'Not Now',
              style: 'cancel',
            },
            {
              text: 'Enable',
              onPress: async () => {
                try {
                  await BiometricService.enableBiometric(email.trim());
                  setBiometricEnabled(true);
                  Alert.alert('Success', `${biometricTypeName} login enabled!`);
                } catch (error: any) {
                  console.error('Error enabling biometric:', error);
                  Alert.alert('Error', 'Failed to enable biometric login');
                }
              },
            },
          ]
        );
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      console.error('Login error in LoginScreen:', errorMessage);
      
      if (errorMessage.includes('2FA_REQUIRED') || errorMessage.includes('requires2FA')) {
        setRequires2FA(true);
        Alert.alert('2FA Required', 'Please enter your 2FA code');
      } else if (errorMessage.includes('ACCOUNT_LOCKED')) {
        Alert.alert('Account Locked', errorMessage);
      } else if (errorMessage.includes('PASSWORD_EXPIRED')) {
        Alert.alert('Password Expired', errorMessage);
      } else if (errorMessage.includes('Cannot connect') || errorMessage.includes('Network error') || errorMessage.includes('Network Error')) {
        // Show detailed network error with actionable steps
        Alert.alert(
          'Network Connection Error',
          errorMessage,
          [
            {
              text: 'OK',
              style: 'default',
            },
          ],
          { cancelable: true }
        );
      } else {
        Alert.alert('Login Failed', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      await loginWithBiometric();
      // Navigation will be handled by the App component based on auth state
    } catch (error: any) {
      const errorMessage = error.message || 'Biometric authentication failed';
      console.error('Biometric login error:', errorMessage);
      
      if (errorMessage.includes('not enabled')) {
        Alert.alert('Biometric Not Enabled', 'Please login with password first to enable biometric login');
      } else if (errorMessage.includes('No stored credentials')) {
        Alert.alert('No Credentials', 'Please login with password first');
      } else {
        Alert.alert('Biometric Login Failed', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.form}>
            <Text style={styles.label}>
              Email, Phone Number, or NIN
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email, phone, or NIN"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="default"
              autoComplete="off"
              editable={!loading}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            {requires2FA && (
              <>
                <Text style={styles.label}>2FA Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 2FA code"
                  value={totp}
                  onChangeText={setTotp}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Biometric Login Button */}
            {biometricAvailable && biometricEnabled && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={loading}
              >
                <Text style={styles.biometricIcon}>
                  {biometricType === 'facial' ? '👤' : '👆'}
                </Text>
                <Text style={styles.biometricText}>
                  {BiometricService.getBiometricTypeName(biometricType)} Login
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.helpText}>
            You can sign in using your email address, phone number, or NIN
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 24,
    // Web-compatible shadow
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 96,
    height: 96,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1f2937',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  biometricIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  biometricText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
});

