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

interface LeaderStats {
  totalMembers: number;
  totalContributions: number;
  pendingLoans: number;
}

export const LeaderDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<LeaderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await apiService.getLeaderStats();
      setStats(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
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
          <Text style={styles.roleText}>Leader Dashboard</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {stats && (
        <>
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
              <Text style={styles.statValue}>{stats.totalMembers}</Text>
              <Text style={styles.statLabel}>Total Members</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.statValue}>
                ₦{stats.totalContributions.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Total Contributions</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.statValue}>{stats.pendingLoans}</Text>
              <Text style={styles.statLabel}>Pending Loans</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <ActionCard
                title="Manage Members"
                description="View and manage all cooperative members"
                icon="👥"
              />
              <ActionCard
                title="View Contributions"
                description="See all member contributions"
                icon="💰"
              />
              <ActionCard
                title="Approve Loans"
                description="Review and approve loan applications"
                icon="📋"
              />
              <ActionCard
                title="2FA Security"
                description="Set up two-factor authentication"
                icon="🔐"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Account</Text>
            <View style={styles.personalCard}>
              <Text style={styles.personalText}>
                Make contributions, apply for loans, and manage investments as a
                cooperative member
              </Text>
              <View style={styles.personalActions}>
                <TouchableOpacity style={styles.personalButton}>
                  <Text style={styles.personalButtonText}>Make Contribution</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.personalButton}>
                  <Text style={styles.personalButtonText}>Apply for Loan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      )}
      
      {/* Banner Ad at the bottom */}
      <BannerAdComponent 
        position="bottom"
        onAdLoaded={() => console.log('Leader Dashboard: Banner ad loaded')}
        onAdFailedToLoad={(error) => console.error('Leader Dashboard: Banner ad failed', error)}
      />
    </ScrollView>
  );
};

const ActionCard: React.FC<{ title: string; description: string; icon: string }> = ({
  title,
  description,
  icon,
}) => (
  <View style={styles.actionCard}>
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionDescription}>{description}</Text>
  </View>
);

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
    fontSize: 24,
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
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  personalCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
  },
  personalText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 16,
  },
  personalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  personalButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  personalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

