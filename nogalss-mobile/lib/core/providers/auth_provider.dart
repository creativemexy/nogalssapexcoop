import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService;
  
  UserModel? _user;
  bool _isLoading = false;
  String? _error;

  AuthProvider(this._authService) {
    _loadUser();
  }

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;
  bool get isMember => _user?.role == 'MEMBER';
  bool get isLeader => _user?.role == 'LEADER';

  Future<void> _loadUser() async {
    _user = await _authService.getCurrentUser();
    notifyListeners();
  }

  Future<bool> login({
    required String email,
    required String password,
    String? totpCode,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final result = await _authService.login(
        email: email,
        password: password,
        totpCode: totpCode,
      );

      if (result['success'] == true) {
        if (result['user'] != null) {
          try {
            _user = UserModel.fromJson(result['user'] as Map<String, dynamic>);
            notifyListeners();
            return true;
          } catch (e) {
            _setError('Failed to parse user data');
            return false;
          }
        }
        return true;
      } else {
        final message = result['message'] ?? '';
        if (message.contains('2FA_REQUIRED') || message.contains('requires2FA')) {
          _setError('2FA_REQUIRED');
        } else {
          _setError(message.isNotEmpty ? message : 'Login failed');
        }
        return false;
      }
    } catch (e) {
      final errorString = e.toString();
      if (errorString.contains('2FA_REQUIRED')) {
        _setError('2FA_REQUIRED');
      } else if (errorString.contains('2FA_INVALID')) {
        _setError('2FA_INVALID');
      } else if (errorString.contains('2FA_NOT_SETUP')) {
        _setError('2FA_NOT_SETUP');
      } else if (errorString.contains('2FA_REQUIRED_GLOBAL')) {
        _setError('2FA_REQUIRED_GLOBAL');
      } else {
        _setError('Login failed: ${errorString.replaceAll('Exception: ', '')}');
      }
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _clearError();
    notifyListeners();
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _setError(String? value) {
    _error = value;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }
}
