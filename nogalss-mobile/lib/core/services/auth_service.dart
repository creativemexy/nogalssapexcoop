import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user_model.dart';
import 'api_service.dart';
import 'storage_service.dart';

class AuthService {
  final ApiService _apiService;
  final StorageService _storageService;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  AuthService(this._apiService, this._storageService);

  // Login with email and password
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
    String? totpCode,
  }) async {
    try {
      final response = await _apiService.login(
        email: email,
        password: password,
        totpCode: totpCode,
      );

      if (response['success'] == true && response['token'] != null) {
        // Store token securely
        await _secureStorage.write(key: 'auth_token', value: response['token']);
        
        // Store user data
        if (response['user'] != null) {
          final user = UserModel.fromJson(response['user']);
          await _storageService.saveUser(user);
        }

        return {
          'success': true,
          'user': response['user'],
          'token': response['token'],
        };
      } else {
        return {
          'success': false,
          'message': response['message'] ?? 'Login failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  // Register new user
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
      final response = await _apiService.register(
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        phoneNumber: phoneNumber,
        cooperativeCode: cooperativeCode,
        nin: nin,
        address: address,
        dateOfBirth: dateOfBirth,
        nextOfKinName: nextOfKinName,
        nextOfKinPhone: nextOfKinPhone,
      );

      return {
        'success': true,
        'message': response['message'] ?? 'Registration successful',
        'data': response['data'],
      };
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  // Logout user
  Future<void> logout() async {
    try {
      await _apiService.logout();
    } catch (e) {
      // Continue with logout even if API call fails
    } finally {
      // Clear stored data
      await _secureStorage.delete(key: 'auth_token');
      await _storageService.clearUser();
    }
  }

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    try {
      final token = await _secureStorage.read(key: 'auth_token');
      return token != null && token.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  // Get stored user data
  Future<UserModel?> getCurrentUser() async {
    try {
      return await _storageService.getUser();
    } catch (e) {
      return null;
    }
  }

  // Get stored token
  Future<String?> getToken() async {
    try {
      return await _secureStorage.read(key: 'auth_token');
    } catch (e) {
      return null;
    }
  }

  // Refresh user data
  Future<UserModel?> refreshUser() async {
    try {
      final response = await _apiService.getUserProfile();
      if (response['success'] == true && response['user'] != null) {
        final user = UserModel.fromJson(response['user']);
        await _storageService.saveUser(user);
        return user;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Update user profile
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> profileData) async {
    try {
      final response = await _apiService.updateUserProfile(profileData);
      
      if (response['success'] == true && response['user'] != null) {
        final user = UserModel.fromJson(response['user']);
        await _storageService.saveUser(user);
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  // Change password
  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final response = await _apiService.post('/user/change-password', data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      });

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  // Enable/Disable 2FA
  Future<Map<String, dynamic>> toggle2FA({required bool enable}) async {
    try {
      final endpoint = enable ? '/user/2fa/enable' : '/user/2fa/disable';
      final response = await _apiService.post(endpoint);

      if (response['success'] == true) {
        // Refresh user data to get updated 2FA status
        await refreshUser();
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  // Verify 2FA setup
  Future<Map<String, dynamic>> verify2FA({required String code}) async {
    try {
      final response = await _apiService.post('/user/2fa/verify', data: {
        'code': code,
      });

      if (response['success'] == true) {
        // Refresh user data
        await refreshUser();
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  // Get 2FA QR code
  Future<Map<String, dynamic>> get2FAQRCode() async {
    try {
      final response = await _apiService.get('/user/2fa/qr-code');
      return response;
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  // Forgot password
  Future<Map<String, dynamic>> forgotPassword({required String email}) async {
    try {
      final response = await _apiService.post('/auth/forgot-password', data: {
        'email': email,
      });

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  // Reset password
  Future<Map<String, dynamic>> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      final response = await _apiService.post('/auth/reset-password', data: {
        'token': token,
        'newPassword': newPassword,
      });

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  // Clear all stored data
  Future<void> clearAllData() async {
    try {
      await _secureStorage.deleteAll();
      await _storageService.clearUser();
    } catch (e) {
      // Handle error silently
    }
  }
}
