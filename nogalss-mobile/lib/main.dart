import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'core/config/app_config.dart';
import 'core/services/api_service.dart';
import 'core/services/auth_service.dart';
import 'core/services/storage_service.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/user_provider.dart';
import 'core/routing/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/utils/app_constants.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    // Initialize Firebase
    await Firebase.initializeApp();
  } catch (e) {
    print('Firebase initialization error: $e');
  }
  
  // Initialize services
  final storageService = StorageService();
  final apiService = ApiService();
  final authService = AuthService(apiService, storageService);
  
  runApp(NogalssApp(
    authService: authService,
    storageService: storageService,
    apiService: apiService,
  ));
}

class NogalssApp extends StatelessWidget {
  final AuthService authService;
  final StorageService storageService;
  final ApiService apiService;

  const NogalssApp({
    Key? key,
    required this.authService,
    required this.storageService,
    required this.apiService,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider(authService)),
        ChangeNotifierProvider(create: (_) => UserProvider(apiService)),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          return MaterialApp.router(
            title: AppConstants.appName,
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: ThemeMode.system,
            routerConfig: AppRouter.router,
            builder: (context, child) {
              return MediaQuery(
                data: MediaQuery.of(context).copyWith(textScaleFactor: 1.0),
                child: child ?? const Scaffold(
                  body: Center(
                    child: Text('Loading Nogalss App...'),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}