class AppConfig {
  // Base URL - Update this to match your Next.js backend URL
  // For local development: http://localhost:3000
  // For production: https://nogalssapexcoop.org
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://nogalssapexcoop.org',
  );

  // API Endpoints
  static const String loginEndpoint = '/api/auth/mobile/login';
  static const String registerEndpoint = '/api/auth/register';
  static const String logoutEndpoint = '/api/auth/signout';
  static const String profileEndpoint = '/api/user/profile';
  
  // Member API Endpoints
  static const String memberContributionsEndpoint = '/api/member/contributions';
  static const String memberVirtualAccountEndpoint = '/api/member/virtual-account';
  static const String memberCooperativeEndpoint = '/api/member/cooperative';
  static const String memberLoanEligibilityEndpoint = '/api/member/loan-eligibility';
  static const String memberLoansEndpoint = '/api/member/loans';
  static const String memberContributeEndpoint = '/api/member/contribute';
  static const String memberWithdrawEndpoint = '/api/member/withdraw';
  static const String memberWithdrawalsEndpoint = '/api/member/withdrawals';
  static const String memberApplyLoanEndpoint = '/api/member/apply-loan';
  
  // Leader API Endpoints
  static const String leaderDashboardStatsEndpoint = '/api/leader/dashboard-stats';
  static const String leaderAllocationsEndpoint = '/api/leader/allocations';
  static const String leaderContributionsEndpoint = '/api/leader/contributions';
  static const String leaderLoansEndpoint = '/api/leader/loans';
  static const String leaderMembersEndpoint = '/api/leader/members';
  static const String leaderWithdrawEndpoint = '/api/leader/withdraw';
  static const String leaderPersonalContributeEndpoint = '/api/leader/personal/contribute';
  static const String leaderPersonalApplyLoanEndpoint = '/api/leader/personal/apply-loan';
  
  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  
  // App Info
  static const String appName = 'Nogalss Mobile';
  static const String appVersion = '1.0.0';
}
