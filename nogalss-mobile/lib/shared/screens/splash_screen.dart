import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers/auth_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(seconds: 2));
    
    if (!mounted) return;
    
    final authProvider = context.read<AuthProvider>();
    if (authProvider.isAuthenticated) {
      final user = authProvider.user;
      if (user != null) {
        if (user.role == 'MEMBER') {
          context.go('/dashboard/member');
        } else if (user.role == 'LEADER') {
          context.go('/dashboard/leader');
        } else {
          context.go('/login');
        }
      } else {
        context.go('/login');
      }
    } else {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFF0FDF4), // green-50
              Color(0xFFFEFCE8), // yellow-50
            ],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                'assets/images/logo.png',
                width: 120,
                height: 120,
                errorBuilder: (context, error, stackTrace) {
                  return const Icon(
                    Icons.account_balance,
                    size: 120,
                    color: Color(0xFF16A34A), // green-600
                  );
                },
              ),
              const SizedBox(height: 24),
              const Text(
                'Nogalss Mobile',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937), // gray-900
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'National Apex Cooperative Society Ltd',
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF6B7280), // gray-600
                ),
              ),
              const SizedBox(height: 48),
              const CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF16A34A)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
