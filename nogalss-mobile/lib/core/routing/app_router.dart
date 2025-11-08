import 'package:go_router/go_router.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/dashboard/screens/member_dashboard_screen.dart';
import '../../features/dashboard/screens/leader_dashboard_screen.dart';
import '../../features/contributions/screens/contributions_screen.dart';
import '../../features/loans/screens/loans_screen.dart';
import '../../features/withdrawals/screens/withdrawals_screen.dart';
import '../../shared/screens/splash_screen.dart';

class AppRouter {
  static GoRouter getRouter() {
    return GoRouter(
      initialLocation: '/splash',
      routes: [
        GoRoute(
          path: '/splash',
          builder: (context, state) => const SplashScreen(),
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/dashboard',
          builder: (context, state) {
            // This will be handled by the dashboard screen itself
            return const MemberDashboardScreen();
          },
        ),
        GoRoute(
          path: '/dashboard/member',
          builder: (context, state) => const MemberDashboardScreen(),
        ),
        GoRoute(
          path: '/dashboard/leader',
          builder: (context, state) => const LeaderDashboardScreen(),
        ),
        GoRoute(
          path: '/contributions',
          builder: (context, state) => const ContributionsScreen(),
        ),
        GoRoute(
          path: '/loans',
          builder: (context, state) => const LoansScreen(),
        ),
        GoRoute(
          path: '/withdrawals',
          builder: (context, state) => const WithdrawalsScreen(),
        ),
      ],
    );
  }

  static void goToDashboard(context, String role) {
    if (role == 'MEMBER') {
      context.go('/dashboard/member');
    } else if (role == 'LEADER') {
      context.go('/dashboard/leader');
    } else {
      context.go('/login');
    }
  }
}
