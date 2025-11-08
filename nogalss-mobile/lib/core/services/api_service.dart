import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

/// API Service that makes HTTP requests to Next.js backend
/// Uses the same API endpoints as the web version
class ApiService {
  late Dio _dio;
  String? _authToken;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: const Duration(milliseconds: 30000),
      receiveTimeout: const Duration(milliseconds: 30000),
      sendTimeout: const Duration(milliseconds: 30000),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      validateStatus: (status) {
        return status != null && status < 500; // Accept all status codes < 500
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_authToken != null) {
          options.headers['Authorization'] = 'Bearer $_authToken';
        }
        handler.next(options);
      },
      onResponse: (response, handler) {
        handler.next(response);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          _authToken = null;
          _storage.delete(key: AppConfig.tokenKey);
        }
        handler.next(error);
      },
    ));
  }

  /// Load token from secure storage
  Future<void> loadToken() async {
    try {
      final token = await _storage.read(key: AppConfig.tokenKey);
      if (token != null && token.isNotEmpty) {
        _authToken = token;
      }
    } catch (e) {
      // Ignore errors
    }
  }

  /// Set auth token
  Future<void> setAuthToken(String token) async {
    _authToken = token;
    await _storage.write(key: AppConfig.tokenKey, value: token);
  }

  /// Clear auth token
  Future<void> clearAuthToken() async {
    _authToken = null;
    await _storage.delete(key: AppConfig.tokenKey);
  }

  /// Parse response data safely
  Map<String, dynamic> _parseResponse(dynamic data) {
    if (data is Map) {
      return Map<String, dynamic>.from(data);
    } else if (data is String) {
      try {
        return Map<String, dynamic>.from(json.decode(data));
      } catch (e) {
        return {'error': data};
      }
    }
    return {};
  }

  // ==================== AUTHENTICATION ====================

  /// Login - uses NextAuth mobile login endpoint
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
    String? totp,
  }) async {
    try {
      await loadToken();
      final response = await _dio.post(
        AppConfig.loginEndpoint,
        data: {
          'email': email,
          'password': password,
          if (totp != null && totp.isNotEmpty) 'totp': totp,
        },
      );

      final data = _parseResponse(response.data);

      if (response.statusCode == 200 && data['success'] == true) {
        final token = data['token']?.toString();
        if (token != null && token.isNotEmpty) {
          await setAuthToken(token);
        }

        return {
          'success': true,
          'user': data['user'] ?? {},
          'token': token,
        };
      }

      throw Exception(data['error']?.toString() ?? 'Login failed');
    } on DioException catch (e) {
      if (e.response != null) {
        final errorData = _parseResponse(e.response!.data);
        final error = errorData['error']?.toString() ?? 'Login failed';

        if (errorData['requires2FA'] == true || error == '2FA_REQUIRED') {
          throw Exception('2FA_REQUIRED');
        } else if (error == '2FA_INVALID') {
          throw Exception('2FA_INVALID');
        } else if (error == '2FA_NOT_SETUP') {
          throw Exception('2FA_NOT_SETUP');
        } else if (error == '2FA_REQUIRED_GLOBAL') {
          throw Exception('2FA_REQUIRED_GLOBAL');
        } else if (e.response!.statusCode == 401) {
          throw Exception('Invalid email or password');
        }
        throw Exception(error);
      }
      
      // Handle network errors with better messages
      String errorMessage = 'Network error';
      if (e.type == DioExceptionType.connectionTimeout) {
        errorMessage = 'Connection timeout. Please check your internet connection.';
      } else if (e.type == DioExceptionType.receiveTimeout) {
        errorMessage = 'Request timeout. Please try again.';
      } else if (e.type == DioExceptionType.sendTimeout) {
        errorMessage = 'Send timeout. Please check your internet connection.';
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Connection error. Please check your internet connection and try again.';
      } else if (e.type == DioExceptionType.badCertificate) {
        errorMessage = 'SSL certificate error. Please contact support.';
      } else if (e.type == DioExceptionType.cancel) {
        errorMessage = 'Request cancelled.';
      } else if (e.message != null && e.message!.isNotEmpty) {
        // Clean up the error message
        errorMessage = e.message!.replaceAll('XMLHttpRequest', '').replaceAll('onError', '').trim();
        if (errorMessage.isEmpty) {
          errorMessage = 'Network error. Please check your connection.';
        }
      }
      throw Exception('Login failed: $errorMessage');
    }
  }

  /// Logout
  Future<void> logout() async {
    try {
      await loadToken();
      await _dio.post(AppConfig.logoutEndpoint);
    } catch (e) {
      // Continue with logout even if API call fails
    } finally {
      await clearAuthToken();
    }
  }

  // ==================== MEMBER APIs ====================

  /// Get member contributions
  Future<Map<String, dynamic>> getMemberContributions() async {
    await loadToken();
    final response = await _dio.get(AppConfig.memberContributionsEndpoint);
    return _parseResponse(response.data);
  }

  /// Get member virtual account
  Future<Map<String, dynamic>> getMemberVirtualAccount() async {
    await loadToken();
    final response = await _dio.get(AppConfig.memberVirtualAccountEndpoint);
    return _parseResponse(response.data);
  }

  /// Get member cooperative
  Future<Map<String, dynamic>> getMemberCooperative() async {
    await loadToken();
    final response = await _dio.get(AppConfig.memberCooperativeEndpoint);
    return _parseResponse(response.data);
  }

  /// Get member loan eligibility
  Future<Map<String, dynamic>> getMemberLoanEligibility() async {
    await loadToken();
    final response = await _dio.get(AppConfig.memberLoanEligibilityEndpoint);
    return _parseResponse(response.data);
  }

  /// Get member loans
  Future<Map<String, dynamic>> getMemberLoans() async {
    await loadToken();
    final response = await _dio.get(AppConfig.memberLoansEndpoint);
    return _parseResponse(response.data);
  }

  /// Make contribution
  Future<Map<String, dynamic>> makeContribution({
    required double amount,
    required String cooperativeId,
  }) async {
    await loadToken();
    final response = await _dio.post(
      AppConfig.memberContributeEndpoint,
      data: {
        'amount': amount,
        'cooperativeId': cooperativeId,
      },
    );
    return _parseResponse(response.data);
  }

  /// Request withdrawal
  Future<Map<String, dynamic>> requestWithdrawal({
    required double amount,
    required String bankAccount,
    required String bankName,
    required String accountName,
  }) async {
    await loadToken();
    final response = await _dio.post(
      AppConfig.memberWithdrawEndpoint,
      data: {
        'amount': amount,
        'bankAccount': bankAccount,
        'bankName': bankName,
        'accountName': accountName,
      },
    );
    return _parseResponse(response.data);
  }

  /// Get member withdrawals
  Future<Map<String, dynamic>> getMemberWithdrawals() async {
    await loadToken();
    final response = await _dio.get(AppConfig.memberWithdrawalsEndpoint);
    return _parseResponse(response.data);
  }

  /// Apply for loan
  Future<Map<String, dynamic>> applyForLoan({
    required double amount,
    required String purpose,
  }) async {
    await loadToken();
    final response = await _dio.post(
      AppConfig.memberApplyLoanEndpoint,
      data: {
        'amount': amount,
        'purpose': purpose,
      },
    );
    return _parseResponse(response.data);
  }

  // ==================== LEADER APIs ====================

  /// Get leader dashboard stats
  Future<Map<String, dynamic>> getLeaderDashboardStats() async {
    await loadToken();
    final response = await _dio.get(AppConfig.leaderDashboardStatsEndpoint);
    return _parseResponse(response.data);
  }

  /// Get leader allocations
  Future<Map<String, dynamic>> getLeaderAllocations() async {
    await loadToken();
    final response = await _dio.get(AppConfig.leaderAllocationsEndpoint);
    return _parseResponse(response.data);
  }

  /// Get leader contributions
  Future<Map<String, dynamic>> getLeaderContributions() async {
    await loadToken();
    final response = await _dio.get(AppConfig.leaderContributionsEndpoint);
    return _parseResponse(response.data);
  }

  /// Get leader loans
  Future<Map<String, dynamic>> getLeaderLoans() async {
    await loadToken();
    final response = await _dio.get(AppConfig.leaderLoansEndpoint);
    return _parseResponse(response.data);
  }

  /// Get leader members
  Future<Map<String, dynamic>> getLeaderMembers() async {
    await loadToken();
    final response = await _dio.get(AppConfig.leaderMembersEndpoint);
    return _parseResponse(response.data);
  }

  /// Approve loan
  Future<Map<String, dynamic>> approveLoan(String loanId) async {
    await loadToken();
    final response = await _dio.post(
      '${AppConfig.leaderLoansEndpoint}/$loanId/approve',
    );
    return _parseResponse(response.data);
  }

  /// Reject loan
  Future<Map<String, dynamic>> rejectLoan(String loanId, String reason) async {
    await loadToken();
    final response = await _dio.post(
      '${AppConfig.leaderLoansEndpoint}/$loanId/reject',
      data: {'reason': reason},
    );
    return _parseResponse(response.data);
  }

  /// Leader personal contribution
  Future<Map<String, dynamic>> leaderPersonalContribute({
    required double amount,
    required String cooperativeId,
  }) async {
    await loadToken();
    final response = await _dio.post(
      AppConfig.leaderPersonalContributeEndpoint,
      data: {
        'amount': amount,
        'cooperativeId': cooperativeId,
      },
    );
    return _parseResponse(response.data);
  }

  /// Leader personal apply loan
  Future<Map<String, dynamic>> leaderPersonalApplyLoan({
    required double amount,
    required String purpose,
  }) async {
    await loadToken();
    final response = await _dio.post(
      AppConfig.leaderPersonalApplyLoanEndpoint,
      data: {
        'amount': amount,
        'purpose': purpose,
      },
    );
    return _parseResponse(response.data);
  }
}
