import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/forgot_password_screen.dart';
import '../../features/auth/screens/reset_password_screen.dart';
import '../../features/auth/screens/verify_2fa_screen.dart';
import '../../features/dashboard/screens/member_dashboard_screen.dart';
import '../../features/dashboard/screens/leader_dashboard_screen.dart';
import '../../features/dashboard/screens/cooperative_dashboard_screen.dart';
import '../../features/dashboard/screens/super_admin_dashboard_screen.dart';
import '../../features/dashboard/screens/apex_dashboard_screen.dart';
import '../../features/dashboard/screens/parent_organization_dashboard_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/profile/screens/edit_profile_screen.dart';
import '../../features/profile/screens/change_password_screen.dart';
import '../../features/profile/screens/security_settings_screen.dart';
import '../../features/contributions/screens/contributions_screen.dart';
import '../../features/contributions/screens/make_contribution_screen.dart';
import '../../features/loans/screens/loans_screen.dart';
import '../../features/loans/screens/apply_loan_screen.dart';
import '../../features/loans/screens/loan_details_screen.dart';
import '../../features/settings/screens/settings_screen.dart';
import '../../features/settings/screens/notifications_screen.dart';
import '../../features/settings/screens/about_screen.dart';
import '../../shared/screens/splash_screen.dart';
import '../../shared/screens/error_screen.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/splash',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final authProvider = context.read<AuthProvider>();
      
      // If user is not authenticated and trying to access protected routes
      if (!authProvider.isAuthenticated) {
        if (state.uri.path.startsWith('/dashboard') || 
            state.uri.path.startsWith('/profile') ||
            state.uri.path.startsWith('/contributions') ||
            state.uri.path.startsWith('/loans') ||
            state.uri.path.startsWith('/settings')) {
          return '/login';
        }
      }
      
      // If user is authenticated and trying to access auth routes
      if (authProvider.isAuthenticated) {
        if (state.uri.path == '/login' || 
            state.uri.path == '/register' ||
            state.uri.path == '/forgot-password' ||
            state.uri.path == '/reset-password') {
          return _getDashboardRoute(authProvider.user?.role);
        }
      }
      
      return null;
    },
    routes: [
      // Splash Screen
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      
      // Authentication Routes
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) => const ResetPasswordScreen(),
      ),
      GoRoute(
        path: '/verify-2fa',
        builder: (context, state) => const Verify2FAScreen(),
      ),
      
      // Dashboard Routes
      GoRoute(
        path: '/dashboard/member',
        builder: (context, state) => const MemberDashboardScreen(),
      ),
      GoRoute(
        path: '/dashboard/leader',
        builder: (context, state) => const LeaderDashboardScreen(),
      ),
      GoRoute(
        path: '/dashboard/cooperative',
        builder: (context, state) => const CooperativeDashboardScreen(),
      ),
      GoRoute(
        path: '/dashboard/super-admin',
        builder: (context, state) => const SuperAdminDashboardScreen(),
      ),
      GoRoute(
        path: '/dashboard/apex',
        builder: (context, state) => const ApexDashboardScreen(),
      ),
      GoRoute(
        path: '/dashboard/parent-organization',
        builder: (context, state) => const ParentOrganizationDashboardScreen(),
      ),
      
      // Profile Routes
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/profile/edit',
        builder: (context, state) => const EditProfileScreen(),
      ),
      GoRoute(
        path: '/profile/change-password',
        builder: (context, state) => const ChangePasswordScreen(),
      ),
      GoRoute(
        path: '/profile/security',
        builder: (context, state) => const SecuritySettingsScreen(),
      ),
      
      // Contributions Routes
      GoRoute(
        path: '/contributions',
        builder: (context, state) => const ContributionsScreen(),
      ),
      GoRoute(
        path: '/contributions/make',
        builder: (context, state) => const MakeContributionScreen(),
      ),
      
      // Loans Routes
      GoRoute(
        path: '/loans',
        builder: (context, state) => const LoansScreen(),
      ),
      GoRoute(
        path: '/loans/apply',
        builder: (context, state) => const ApplyLoanScreen(),
      ),
      GoRoute(
        path: '/loans/:id',
        builder: (context, state) => LoanDetailsScreen(
          loanId: state.pathParameters['id']!,
        ),
      ),
      
      // Settings Routes
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/settings/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/settings/about',
        builder: (context, state) => const AboutScreen(),
      ),
      
      // Error Route
      GoRoute(
        path: '/error',
        builder: (context, state) => ErrorScreen(
          error: state.extra as String? ?? 'An error occurred',
        ),
      ),
    ],
    errorBuilder: (context, state) => ErrorScreen(
      error: state.error?.toString() ?? 'Navigation error',
    ),
  );

  static String _getDashboardRoute(String? role) {
    switch (role) {
      case 'MEMBER':
        return '/dashboard/member';
      case 'LEADER':
        return '/dashboard/leader';
      case 'COOPERATIVE':
        return '/dashboard/cooperative';
      case 'SUPER_ADMIN':
        return '/dashboard/super-admin';
      case 'APEX':
        return '/dashboard/apex';
      case 'PARENT_ORGANIZATION':
        return '/dashboard/parent-organization';
      default:
        return '/dashboard/member';
    }
  }

  // Navigation helpers
  static void goToLogin(BuildContext context) {
    context.go('/login');
  }

  static void goToRegister(BuildContext context) {
    context.go('/register');
  }

  static void goToDashboard(BuildContext context, String role) {
    context.go(_getDashboardRoute(role));
  }

  static void goToProfile(BuildContext context) {
    context.go('/profile');
  }

  static void goToContributions(BuildContext context) {
    context.go('/contributions');
  }

  static void goToLoans(BuildContext context) {
    context.go('/loans');
  }

  static void goToSettings(BuildContext context) {
    context.go('/settings');
  }

  static void goToError(BuildContext context, String error) {
    context.go('/error', extra: error);
  }
}
