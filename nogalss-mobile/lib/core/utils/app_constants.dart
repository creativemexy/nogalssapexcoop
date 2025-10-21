class AppConstants {
  // App Information
  static const String appName = 'Nogalss Cooperative';
  static const String appVersion = '1.0.0';
  static const String appBuildNumber = '1';
  
  // User Roles
  static const String roleMember = 'MEMBER';
  static const String roleLeader = 'LEADER';
  static const String roleCooperative = 'COOPERATIVE';
  static const String roleSuperAdmin = 'SUPER_ADMIN';
  static const String roleApex = 'APEX';
  static const String roleParentOrganization = 'PARENT_ORGANIZATION';
  
  // Transaction Types
  static const String transactionContribution = 'CONTRIBUTION';
  static const String transactionLoan = 'LOAN';
  static const String transactionWithdrawal = 'WITHDRAWAL';
  static const String transactionFee = 'FEE';
  static const String transactionInvestment = 'INVESTMENT';
  static const String transactionRepayment = 'REPAYMENT';
  
  // Loan Status
  static const String loanStatusPending = 'PENDING';
  static const String loanStatusApproved = 'APPROVED';
  static const String loanStatusRejected = 'REJECTED';
  static const String loanStatusActive = 'ACTIVE';
  static const String loanStatusCompleted = 'COMPLETED';
  static const String loanStatusDefaulted = 'DEFAULTED';
  
  // Contribution Status
  static const String contributionStatusPending = 'PENDING';
  static const String contributionStatusSuccessful = 'SUCCESSFUL';
  static const String contributionStatusFailed = 'FAILED';
  
  // User Status
  static const String userStatusActive = 'ACTIVE';
  static const String userStatusInactive = 'INACTIVE';
  static const String userStatusSuspended = 'SUSPENDED';
  static const String userStatusPending = 'PENDING';
  
  // Currency
  static const String currency = 'NGN';
  static const String currencySymbol = '₦';
  
  // Date Formats
  static const String dateFormat = 'dd/MM/yyyy';
  static const String dateTimeFormat = 'dd/MM/yyyy HH:mm';
  static const String timeFormat = 'HH:mm';
  
  // Validation
  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 50;
  static const int minPhoneLength = 10;
  static const int maxPhoneLength = 15;
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  
  // File Upload
  static const int maxFileSize = 5 * 1024 * 1024; // 5MB
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif'];
  static const List<String> allowedDocumentTypes = ['pdf', 'doc', 'docx'];
  
  // API Timeouts
  static const int connectTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000; // 30 seconds
  static const int sendTimeout = 30000; // 30 seconds
  
  // Cache Duration
  static const int cacheExpiryMinutes = 5;
  static const int userDataCacheHours = 24;
  
  // Error Messages
  static const String networkErrorMessage = 'Network error. Please check your connection.';
  static const String serverErrorMessage = 'Server error. Please try again later.';
  static const String unauthorizedMessage = 'Session expired. Please login again.';
  static const String forbiddenMessage = 'Access denied. You don\'t have permission.';
  static const String notFoundMessage = 'Resource not found.';
  static const String validationErrorMessage = 'Please check your input and try again.';
}
