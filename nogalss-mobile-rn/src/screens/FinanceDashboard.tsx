import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { BiometricService } from '../services/biometric';

interface FinanceStats {
  totalInflow: number;
  totalOutflow: number;
  netBalance: number;
  adminFees: { amount: number; count: number };
  contributions: { amount: number; count: number };
  loans: { amount: number; count: number };
  withdrawals: { amount: number; count: number };
  loanRepayments: { amount: number; count: number };
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    date: string;
    user: string;
    status?: string;
  }>;
  monthlyBreakdown: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  userBreakdown: Array<{
    role: string;
    count: number;
  }>;
  chargeTracking?: {
    totalCharges: number;
    totalBaseAmount: number;
    chargeCount: number;
    averageChargePercentage: number;
  };
}

export const FinanceDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'facial' | 'iris' | 'none'>('none');
  const [biometricLoading, setBiometricLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await apiService.getFinanceStats();
      setStats(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load finance dashboard stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    try {
      const available = await BiometricService.isAvailable();
      setBiometricAvailable(available);
      
      if (available) {
        const type = await BiometricService.getBiometricType();
        setBiometricType(type);
        const enabled = await BiometricService.isBiometricEnabled();
        setBiometricEnabled(enabled);
      }
    } catch (error) {
      console.error('Error checking biometric status:', error);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (!biometricAvailable) {
      Alert.alert(
        'Not Available',
        'Biometric authentication is not available on this device. Please ensure fingerprint or face recognition is set up in your device settings.'
      );
      return;
    }

    setBiometricLoading(true);
    try {
      if (value) {
        // Enable biometric - authenticate first
        const result = await BiometricService.authenticate(
          'Authenticate to enable biometric login'
        );
        
        if (result.success) {
          // Get user email and credentials for biometric
          const email = user?.email || '';
          if (!email) {
            Alert.alert('Error', 'User email not found');
            return;
          }
          
          // Get current token and user for storage
          const token = await apiService.getStoredToken();
          const currentUser = await apiService.getStoredUser();
          
          if (!token || !currentUser) {
            Alert.alert('Error', 'No credentials found. Please login again.');
            return;
          }
          
          // Enable biometric and store credentials
          await BiometricService.enableBiometric(email, token, currentUser);
          setBiometricEnabled(true);
          Alert.alert(
            'Success',
            `${BiometricService.getBiometricTypeName(biometricType)} login enabled!`
          );
        } else {
          Alert.alert('Authentication Failed', result.error || 'Biometric authentication was cancelled');
        }
      } else {
        // Disable biometric
        await BiometricService.disableBiometric();
        setBiometricEnabled(false);
        Alert.alert('Success', 'Biometric login disabled');
      }
    } catch (error: any) {
      console.error('Error toggling biometric:', error);
      Alert.alert('Error', error.message || 'Failed to update biometric settings');
    } finally {
      setBiometricLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleLogout = () => {
    console.log('handleLogout called');
    
    // For web, use window.confirm; for native, use Alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        console.log('User confirmed logout (web)');
        logout().catch((error) => {
          console.error('Logout error:', error);
          // Force logout even on error
          logout();
        });
      } else {
        console.log('User cancelled logout (web)');
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => console.log('User cancelled logout')
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: () => {
              console.log('User confirmed logout (native)');
              // Call logout - this will clear auth and update state
              logout().catch((error) => {
                console.error('Logout error:', error);
                // Force logout even on error
                logout();
              });
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'SUCCESSFUL':
        return '#10b981';
      case 'PENDING':
        return '#f59e0b';
      case 'FAILED':
        return '#ef4444';
      case 'CANCELLED':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CONTRIBUTION':
        return '#10b981';
      case 'WITHDRAWAL':
        return '#ef4444';
      case 'FEE':
        return '#f59e0b';
      case 'LOAN':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading finance dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome, {user?.name}</Text>
          <Text style={styles.roleText}>Finance Dashboard</Text>
        </View>
        <TouchableOpacity 
          onPress={() => {
            console.log('Logout button pressed');
            handleLogout();
          }} 
          style={styles.logoutButton}
          activeOpacity={0.7}
          testID="logout-button"
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {stats && (
        <>
          {/* Main Financial Metrics - Most Important */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
              <Text style={styles.statValue}>{formatCurrency(stats.totalInflow)}</Text>
              <Text style={styles.statLabel}>Total Inflow</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#ef4444' }]}>
              <Text style={styles.statValue}>{formatCurrency(stats.totalOutflow)}</Text>
              <Text style={styles.statLabel}>Total Outflow</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
              <Text
                style={[
                  styles.statValue,
                  { color: stats.netBalance >= 0 ? '#fff' : '#fee2e2' },
                ]}
              >
                {formatCurrency(stats.netBalance)}
              </Text>
              <Text style={styles.statLabel}>Net Balance</Text>
            </View>
          </View>

          {/* Key Financial Breakdown - Simplified */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <View style={styles.keyMetricsGrid}>
              <View style={styles.keyMetricCard}>
                <Text style={styles.keyMetricIcon}>💰</Text>
                <Text style={styles.keyMetricLabel}>Contributions</Text>
                <Text style={[styles.keyMetricValue, { color: '#10b981' }]}>
                  {formatCurrency(stats.contributions.amount)}
                </Text>
                <Text style={styles.keyMetricCount}>
                  {stats.contributions.count} transactions
                </Text>
              </View>

              <View style={styles.keyMetricCard}>
                <Text style={styles.keyMetricIcon}>💸</Text>
                <Text style={styles.keyMetricLabel}>Withdrawals</Text>
                <Text style={[styles.keyMetricValue, { color: '#ef4444' }]}>
                  {formatCurrency(stats.withdrawals.amount)}
                </Text>
                <Text style={styles.keyMetricCount}>
                  {stats.withdrawals.count} transactions
                </Text>
              </View>

              <View style={styles.keyMetricCard}>
                <Text style={styles.keyMetricIcon}>📋</Text>
                <Text style={styles.keyMetricLabel}>Loans</Text>
                <Text style={[styles.keyMetricValue, { color: '#f59e0b' }]}>
                  {formatCurrency(stats.loans.amount)}
                </Text>
                <Text style={styles.keyMetricCount}>
                  {stats.loans.count} loans
                </Text>
              </View>

              <View style={styles.keyMetricCard}>
                <Text style={styles.keyMetricIcon}>💳</Text>
                <Text style={styles.keyMetricLabel}>Loan Repayments</Text>
                <Text style={[styles.keyMetricValue, { color: '#3b82f6' }]}>
                  {formatCurrency(stats.loanRepayments.amount)}
                </Text>
                <Text style={styles.keyMetricCount}>
                  {stats.loanRepayments.count} transactions
                </Text>
              </View>
            </View>
          </View>

          {/* Biometric Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Settings</Text>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>
                  {biometricType === 'facial' ? '👤' : '👆'} {BiometricService.getBiometricTypeName(biometricType)} Login
                </Text>
                <Text style={styles.settingDescription}>
                  {biometricEnabled 
                    ? `Use ${BiometricService.getBiometricTypeName(biometricType).toLowerCase()} to quickly login`
                    : biometricAvailable
                    ? `Enable ${BiometricService.getBiometricTypeName(biometricType).toLowerCase()} for faster login`
                    : 'Biometric authentication not available on this device'}
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                disabled={!biometricAvailable || biometricLoading}
                trackColor={{ false: '#d1d5db', true: '#059669' }}
                thumbColor={biometricEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
            {biometricLoading && (
              <View style={styles.settingLoadingContainer}>
                <ActivityIndicator size="small" color="#059669" />
                <Text style={styles.settingLoadingText}>Updating...</Text>
              </View>
            )}
          </View>

          {/* Recent Transactions - Limited to 5 most recent */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {stats.recentTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No recent transactions</Text>
              </View>
            ) : (
              stats.recentTransactions.slice(0, 5).map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionLeft}>
                      <Text
                        style={[
                          styles.transactionType,
                          { color: getTypeColor(transaction.type) },
                        ]}
                      >
                        {transaction.type}
                      </Text>
                      <Text style={styles.transactionUser}>{transaction.user}</Text>
                    </View>
                    <Text style={styles.transactionAmount}>
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                  <View style={styles.transactionFooter}>
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </Text>
                    {transaction.status && (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(transaction.status) },
                        ]}
                      >
                        <Text style={styles.statusText}>{transaction.status}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  roleText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
  },
  settingLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  keyMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  keyMetricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  keyMetricIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  keyMetricLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  keyMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  keyMetricCount: {
    fontSize: 11,
    color: '#6b7280',
  },
  transactionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionUser: {
    fontSize: 14,
    color: '#6b7280',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
  },
});

