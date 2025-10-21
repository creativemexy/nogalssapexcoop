class AppConfig {
  // API Configuration
  static const String baseUrl = 'https://nogalssapexcoop.org/api';
  static const String apiVersion = 'v1';
  
  // Database Configuration
  static const String databaseUrl = 'postgresql://postgres:fuckyou@2025@129.146.39.42:5432/apex';
  
  // App Configuration
  static const String appName = 'NOGALSS';
  static const String appVersion = '1.0.0';
  
  // API Endpoints
  static const String loginEndpoint = '/auth/login';
  static const String registerEndpoint = '/auth/register';
  static const String logoutEndpoint = '/auth/logout';
  static const String profileEndpoint = '/user/profile';
  static const String dashboardEndpoint = '/dashboard/stats';
  static const String contributionsEndpoint = '/contributions';
  static const String loansEndpoint = '/loans';
  
  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String themeKey = 'theme_mode';
  static const String biometricKey = 'biometric_enabled';
  
  // App Settings
  static const int sessionTimeoutMinutes = 30;
  static const int maxLoginAttempts = 5;
  static const int otpExpiryMinutes = 5;
  
  // Payment Configuration
  static const String paystackPublicKey = 'pk_test_your_paystack_key';
  static const String paystackSecretKey = 'sk_test_your_paystack_secret';
  
  // Notification Configuration
  static const String fcmServerKey = 'your_fcm_server_key';
  
  // Security
  static const int passwordMinLength = 8;
  static const bool requireBiometric = false;
  static const bool enableDebugMode = true;
}
