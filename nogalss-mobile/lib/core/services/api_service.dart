import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../utils/app_constants.dart';

class ApiService {
  late Dio _dio;
  String? _authToken;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: Duration(milliseconds: AppConstants.connectTimeout),
      receiveTimeout: Duration(milliseconds: AppConstants.receiveTimeout),
      sendTimeout: Duration(milliseconds: AppConstants.sendTimeout),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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
          // Handle unauthorized access
          _authToken = null;
        }
        handler.next(error);
      },
    ));
  }

  void setAuthToken(String token) {
    _authToken = token;
  }

  void clearAuthToken() {
    _authToken = null;
  }

  // Authentication Methods
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
    String? totpCode,
  }) async {
    try {
      final response = await _dio.post(AppConfig.loginEndpoint, data: {
        'email': email,
        'password': password,
        if (totpCode != null) 'totpCode': totpCode,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['token'] != null) {
          setAuthToken(data['token']);
        }
        return data;
      } else {
        throw Exception('Login failed: ${response.data['message'] ?? 'Unknown error'}');
      }
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Map<String, dynamic>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String phoneNumber,
    required String cooperativeCode,
    String? nin,
    String? address,
    DateTime? dateOfBirth,
    String? nextOfKinName,
    String? nextOfKinPhone,
  }) async {
    try {
      final response = await _dio.post(AppConfig.registerEndpoint, data: {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': password,
        'phoneNumber': phoneNumber,
        'cooperativeCode': cooperativeCode,
        if (nin != null) 'nin': nin,
        if (address != null) 'address': address,
        if (dateOfBirth != null) 'dateOfBirth': dateOfBirth.toIso8601String(),
        if (nextOfKinName != null) 'nextOfKinName': nextOfKinName,
        if (nextOfKinPhone != null) 'nextOfKinPhone': nextOfKinPhone,
      });

      if (response.statusCode == 201) {
        return response.data;
      } else {
        throw Exception('Registration failed: ${response.data['message'] ?? 'Unknown error'}');
      }
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post(AppConfig.logoutEndpoint);
    } catch (e) {
      // Logout even if API call fails
    } finally {
      clearAuthToken();
    }
  }

  // User Methods
  Future<Map<String, dynamic>> getUserProfile() async {
    try {
      final response = await _dio.get(AppConfig.profileEndpoint);
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Map<String, dynamic>> updateUserProfile(Map<String, dynamic> profileData) async {
    try {
      final response = await _dio.put(AppConfig.profileEndpoint, data: profileData);
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Dashboard Methods
  Future<Map<String, dynamic>> getDashboardStats() async {
    try {
      final response = await _dio.get(AppConfig.dashboardEndpoint);
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Contribution Methods
  Future<List<Map<String, dynamic>>> getContributions({
    int page = 1,
    int limit = 20,
    String? status,
  }) async {
    try {
      final response = await _dio.get(AppConfig.contributionsEndpoint, queryParameters: {
        'page': page,
        'limit': limit,
        if (status != null) 'status': status,
      });
      return List<Map<String, dynamic>>.from(response.data['data'] ?? []);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Map<String, dynamic>> makeContribution({
    required double amount,
    required String description,
    String? paymentMethod,
  }) async {
    try {
      final response = await _dio.post(AppConfig.contributionsEndpoint, data: {
        'amount': amount,
        'description': description,
        if (paymentMethod != null) 'paymentMethod': paymentMethod,
      });
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Loan Methods
  Future<List<Map<String, dynamic>>> getLoans({
    int page = 1,
    int limit = 20,
    String? status,
  }) async {
    try {
      final response = await _dio.get(AppConfig.loansEndpoint, queryParameters: {
        'page': page,
        'limit': limit,
        if (status != null) 'status': status,
      });
      return List<Map<String, dynamic>>.from(response.data['data'] ?? []);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Map<String, dynamic>> applyForLoan({
    required double amount,
    required String purpose,
    required int durationMonths,
    String? collateral,
  }) async {
    try {
      final response = await _dio.post(AppConfig.loansEndpoint, data: {
        'amount': amount,
        'purpose': purpose,
        'durationMonths': durationMonths,
        if (collateral != null) 'collateral': collateral,
      });
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Generic GET request
  Future<Map<String, dynamic>> get(String endpoint, {Map<String, dynamic>? queryParameters}) async {
    try {
      final response = await _dio.get(endpoint, queryParameters: queryParameters);
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Generic POST request
  Future<Map<String, dynamic>> post(String endpoint, {Map<String, dynamic>? data}) async {
    try {
      final response = await _dio.post(endpoint, data: data);
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Generic PUT request
  Future<Map<String, dynamic>> put(String endpoint, {Map<String, dynamic>? data}) async {
    try {
      final response = await _dio.put(endpoint, data: data);
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  // Generic DELETE request
  Future<Map<String, dynamic>> delete(String endpoint) async {
    try {
      final response = await _dio.delete(endpoint);
      return response.data;
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Exception _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return Exception(AppConstants.networkErrorMessage);
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        switch (statusCode) {
          case 401:
            return Exception(AppConstants.unauthorizedMessage);
          case 403:
            return Exception(AppConstants.forbiddenMessage);
          case 404:
            return Exception(AppConstants.notFoundMessage);
          case 422:
            return Exception(AppConstants.validationErrorMessage);
          default:
            return Exception(AppConstants.serverErrorMessage);
        }
      case DioExceptionType.cancel:
        return Exception('Request cancelled');
      case DioExceptionType.connectionError:
        return Exception(AppConstants.networkErrorMessage);
      default:
        return Exception(AppConstants.serverErrorMessage);
    }
  }
}
