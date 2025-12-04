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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { BannerAdComponent } from '../components/BannerAd';

interface MemberStats {
  totalAmount: number;
}

interface Contribution {
  id: string;
  amount: number;
  createdAt: string;
  cooperative: {
    name: string;
    registrationNumber: string;
  };
  description?: string;
}

interface LoanEligibility {
  isEligible: boolean;
  maxLoanAmount: number;
  reason?: string;
}

interface VirtualAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export const MemberDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [savings, setSavings] = useState<number>(0);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loanEligibility, setLoanEligibility] = useState<LoanEligibility | null>(null);
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch contributions
      const contributionsData = await apiService.getMemberContributions();
      if (contributionsData.stats) {
        setSavings(contributionsData.stats.totalAmount || 0);
      }
      if (contributionsData.contributions) {
        setContributions(contributionsData.contributions.slice(0, 3));
      }

      // Fetch loan eligibility
      try {
        const loanData = await apiService.getMemberLoanEligibility();
        setLoanEligibility({
          isEligible: loanData.isEligible || false,
          maxLoanAmount: loanData.maxLoanAmount || savings * 6,
          reason: loanData.reason,
        });
      } catch (error) {
        // Fallback calculation
        setLoanEligibility({
          isEligible: savings > 0,
          maxLoanAmount: savings * 6,
          reason: savings > 0 ? 'Based on your contributions' : 'Make contributions to become eligible',
        });
      }

      // Fetch virtual account
      try {
        const accountData = await apiService.getMemberVirtualAccount();
        if (accountData.virtualAccount) {
          setVirtualAccount(accountData.virtualAccount);
        }
      } catch (error) {
        // Virtual account might not be set up yet
        console.log('Virtual account not available');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
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
          <Text style={styles.roleText}>Member Dashboard</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Virtual Account Section */}
      {virtualAccount && (
        <View style={styles.virtualAccountCard}>
          <Text style={styles.virtualAccountTitle}>Your Virtual Account</Text>
          <View style={styles.virtualAccountInfo}>
            <View style={styles.virtualAccountRow}>
              <Text style={styles.virtualAccountLabel}>Bank:</Text>
              <Text style={styles.virtualAccountValue}>
                {virtualAccount.bankName}
              </Text>
            </View>
            <View style={styles.virtualAccountRow}>
              <Text style={styles.virtualAccountLabel}>Account Number:</Text>
              <Text style={styles.virtualAccountValue}>
                {virtualAccount.accountNumber}
              </Text>
            </View>
            <View style={styles.virtualAccountRow}>
              <Text style={styles.virtualAccountLabel}>Account Name:</Text>
              <Text style={styles.virtualAccountValue}>
                {virtualAccount.accountName}
              </Text>
            </View>
          </View>
          <Text style={styles.virtualAccountNote}>
            Use this account to make contributions. All deposits will be
            automatically credited.
          </Text>
        </View>
      )}

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
          <Text style={styles.statValue}>
            ₦{savings.toLocaleString('en-NG', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={styles.statLabel}>Total Contributions</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
          <Text style={styles.statValue}>
            ₦{(loanEligibility?.maxLoanAmount || savings * 6).toLocaleString('en-NG', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text style={styles.statLabel}>Available Loan</Text>
          {loanEligibility && !loanEligibility.isEligible && (
            <Text style={styles.statSubtext}>
              {loanEligibility.reason || 'Make contributions to become eligible'}
            </Text>
          )}
        </View>
      </View>

      {/* Contribution History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Contributions</Text>
        {contributions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No contributions yet</Text>
          </View>
        ) : (
          contributions.map((contrib) => (
            <View key={contrib.id} style={styles.contributionItem}>
              <View style={styles.contributionHeader}>
                <Text style={styles.contributionAmount}>
                  ₦{Number(contrib.amount).toLocaleString('en-NG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
                <Text style={styles.contributionDate}>
                  {new Date(contrib.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.contributionCooperative}>
                {contrib.cooperative.name}
              </Text>
              {contrib.description && (
                <Text style={styles.contributionDescription}>
                  {contrib.description}
                </Text>
              )}
            </View>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#10b981' }]}>
            <Text style={styles.actionButtonIcon}>💰</Text>
            <Text style={styles.actionButtonText}>Make Contribution</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}>
            <Text style={styles.actionButtonIcon}>💸</Text>
            <Text style={styles.actionButtonText}>Request Withdrawal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#8b5cf6' }]}>
            <Text style={styles.actionButtonIcon}>📋</Text>
            <Text style={styles.actionButtonText}>Apply for Loan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ef4444' }]}>
            <Text style={styles.actionButtonIcon}>🔐</Text>
            <Text style={styles.actionButtonText}>2FA Security</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Banner Ad at the bottom */}
      <BannerAdComponent 
        position="bottom"
        onAdLoaded={() => console.log('Member Dashboard: Banner ad loaded')}
        onAdFailedToLoad={(error) => console.error('Member Dashboard: Banner ad failed', error)}
      />
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
  virtualAccountCard: {
    backgroundColor: '#d1fae5',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  virtualAccountTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 12,
  },
  virtualAccountInfo: {
    marginBottom: 12,
  },
  virtualAccountRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  virtualAccountLabel: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '600',
    width: 120,
  },
  virtualAccountValue: {
    fontSize: 14,
    color: '#065f46',
    flex: 1,
  },
  virtualAccountNote: {
    fontSize: 12,
    color: '#047857',
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
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
  statSubtext: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
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
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
  },
  contributionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  contributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contributionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  contributionDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  contributionCooperative: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  contributionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});

