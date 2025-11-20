import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { LeaderDashboard } from './src/screens/LeaderDashboard';
import { MemberDashboard } from './src/screens/MemberDashboard';
import { FinanceDashboard } from './src/screens/FinanceDashboard';
import { View, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { SplashScreen } from './src/components/SplashScreen';
import { NotificationService } from './src/services/notifications';

const Stack = createNativeStackNavigator();

const AppNavigator: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const navigationRef = useRef<any>(null);
  const [showSplash, setShowSplash] = useState(true);

  // Force navigation reset when authentication state changes
  useEffect(() => {
    if (!loading && navigationRef.current) {
      if (!isAuthenticated) {
        // Reset navigation to login when logged out
        try {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } catch (error) {
          console.error('Navigation reset error:', error);
        }
      }
    }
  }, [isAuthenticated, loading]);

  // Show splash screen on initial load
  if (showSplash) {
    return (
      <SplashScreen
        onFinish={() => setShowSplash(false)}
        duration={2000}
      />
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  // Determine initial route
  const getInitialRouteName = () => {
    if (!isAuthenticated) return 'Login';
    if (user?.role === 'LEADER') return 'LeaderDashboard';
    if (user?.role === 'MEMBER') return 'MemberDashboard';
    if (user?.role === 'FINANCE') return 'FinanceDashboard';
    return 'Login';
  };

  return (
    <NavigationContainer 
      ref={navigationRef}
      key={isAuthenticated ? `auth-${user?.role || 'none'}-${user?.id || ''}` : 'unauth'}
    >
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={getInitialRouteName()}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="LeaderDashboard" component={LeaderDashboard} />
        <Stack.Screen name="MemberDashboard" component={MemberDashboard} />
        <Stack.Screen name="FinanceDashboard" component={FinanceDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Initialize notifications
    const setupNotifications = async () => {
      try {
        // Register for push notifications
        await NotificationService.registerForPushNotifications();
        
        // Set up notification listeners
        NotificationService.setupNotificationListeners(
          (notification) => {
            // Handle notification received while app is in foreground
            console.log('Notification received:', notification);
          },
          (response) => {
            // Handle notification tapped
            console.log('Notification tapped:', response);
            const data = response.notification.request.content.data;
            
            // Navigate based on notification type
            if (data?.type === 'LOAN_APPROVAL' || data?.type === 'LOAN_REJECTION') {
              // Navigate to loans screen
              // navigationRef.current?.navigate('Loans');
            } else if (data?.type === 'CONTRIBUTION_CONFIRMATION') {
              // Navigate to contributions screen
              // navigationRef.current?.navigate('Contributions');
            }
          }
        );
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default App;

