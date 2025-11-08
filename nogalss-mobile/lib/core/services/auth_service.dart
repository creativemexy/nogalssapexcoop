import '../models/user_model.dart';
import 'api_service.dart';
import 'storage_service.dart';

class AuthService {
  final ApiService _apiService;
  final StorageService _storageService;

  AuthService(this._apiService, this._storageService);

  /// Login with email and password
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
    String? totpCode,
  }) async {
    try {
      final response = await _apiService.login(
        email: email,
        password: password,
        totp: totpCode,
      );

      if (response['success'] == true) {
        if (response['user'] != null) {
          try {
            final user = UserModel.fromJson(response['user'] as Map<String, dynamic>);
            await _storageService.saveUser(user);
          } catch (e) {
            // Continue even if user parsing fails
          }
        }

        return {
          'success': true,
          'user': response['user'] ?? {},
          'token': response['token'],
        };
      } else {
        final error = response['error']?.toString() ?? 'Login failed';
        return {
          'success': false,
          'message': error,
          'requires2FA': error.contains('2FA_REQUIRED'),
        };
      }
    } catch (e) {
      final errorString = e.toString().replaceAll('Exception: ', '');
      return {
        'success': false,
        'message': errorString,
        'requires2FA': errorString.contains('2FA_REQUIRED'),
      };
    }
  }

  /// Logout
  Future<void> logout() async {
    await _apiService.logout();
    await _storageService.clearUser();
  }

  /// Get current user
  Future<UserModel?> getCurrentUser() async {
    return await _storageService.getUser();
  }
}

