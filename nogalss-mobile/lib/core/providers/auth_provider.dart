import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService;
  
  UserModel? _user;
  bool _isLoading = false;
  bool _isAuthenticated = false;
  String? _error;

  AuthProvider(this._authService) {
    _initializeAuth();
  }

  // Getters
  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String? get error => _error;

  // Initialize authentication state
  Future<void> _initializeAuth() async {
    _setLoading(true);
    try {
      final isLoggedIn = await _authService.isLoggedIn();
      if (isLoggedIn) {
        final user = await _authService.getCurrentUser();
        if (user != null) {
          _user = user;
          _isAuthenticated = true;
        }
      }
    } catch (e) {
      _setError('Failed to initialize authentication: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Login method
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
        _user = UserModel.fromJson(result['user']);
        _isAuthenticated = true;
        notifyListeners();
        return true;
      } else {
        _setError(result['message'] ?? 'Login failed');
        return false;
      }
    } catch (e) {
      _setError('Login failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Register method
  Future<bool> register({
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
    _setLoading(true);
    _clearError();
    
    try {
      final result = await _authService.register(
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

      if (result['success'] == true) {
        return true;
      } else {
        _setError(result['message'] ?? 'Registration failed');
        return false;
      }
    } catch (e) {
      _setError('Registration failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Logout method
  Future<void> logout() async {
    _setLoading(true);
    try {
      await _authService.logout();
      _user = null;
      _isAuthenticated = false;
      notifyListeners();
    } catch (e) {
      _setError('Logout failed: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Refresh user data
  Future<void> refreshUser() async {
    if (!_isAuthenticated) return;
    
    try {
      final refreshedUser = await _authService.refreshUser();
      if (refreshedUser != null) {
        _user = refreshedUser;
        notifyListeners();
      }
    } catch (e) {
      _setError('Failed to refresh user data: $e');
    }
  }

  // Update user profile
  Future<bool> updateProfile(Map<String, dynamic> profileData) async {
    _setLoading(true);
    _clearError();
    
    try {
      final result = await _authService.updateProfile(profileData);
      
      if (result['success'] == true) {
        // Refresh user data
        await refreshUser();
        return true;
      } else {
        _setError(result['message'] ?? 'Profile update failed');
        return false;
      }
    } catch (e) {
      _setError('Profile update failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Change password
  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final result = await _authService.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      
      if (result['success'] == true) {
        return true;
      } else {
        _setError(result['message'] ?? 'Password change failed');
        return false;
      }
    } catch (e) {
      _setError('Password change failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Toggle 2FA
  Future<bool> toggle2FA({required bool enable}) async {
    _setLoading(true);
    _clearError();
    
    try {
      final result = await _authService.toggle2FA(enable: enable);
      
      if (result['success'] == true) {
        return true;
      } else {
        _setError(result['message'] ?? '2FA toggle failed');
        return false;
      }
    } catch (e) {
      _setError('2FA toggle failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Verify 2FA
  Future<bool> verify2FA({required String code}) async {
    _setLoading(true);
    _clearError();
    
    try {
      final result = await _authService.verify2FA(code: code);
      
      if (result['success'] == true) {
        return true;
      } else {
        _setError(result['message'] ?? '2FA verification failed');
        return false;
      }
    } catch (e) {
      _setError('2FA verification failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Get 2FA QR code
  Future<Map<String, dynamic>?> get2FAQRCode() async {
    try {
      return await _authService.get2FAQRCode();
    } catch (e) {
      _setError('Failed to get 2FA QR code: $e');
      return null;
    }
  }

  // Forgot password
  Future<bool> forgotPassword({required String email}) async {
    _setLoading(true);
    _clearError();
    
    try {
      final result = await _authService.forgotPassword(email: email);
      
      if (result['success'] == true) {
        return true;
      } else {
        _setError(result['message'] ?? 'Password reset failed');
        return false;
      }
    } catch (e) {
      _setError('Password reset failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Reset password
  Future<bool> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    _setLoading(true);
    _clearError();
    
    try {
      final result = await _authService.resetPassword(
        token: token,
        newPassword: newPassword,
      );
      
      if (result['success'] == true) {
        return true;
      } else {
        _setError(result['message'] ?? 'Password reset failed');
        return false;
      }
    } catch (e) {
      _setError('Password reset failed: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Clear all data
  Future<void> clearAllData() async {
    try {
      await _authService.clearAllData();
      _user = null;
      _isAuthenticated = false;
      _clearError();
      notifyListeners();
    } catch (e) {
      _setError('Failed to clear data: $e');
    }
  }

  // Helper methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  // Check if user has specific role
  bool hasRole(String role) {
    return _user?.role == role;
  }

  // Check if user is member
  bool get isMember => _user?.isMember ?? false;

  // Check if user is leader
  bool get isLeader => _user?.isLeader ?? false;

  // Check if user is cooperative
  bool get isCooperative => _user?.isCooperative ?? false;

  // Check if user is super admin
  bool get isSuperAdmin => _user?.isSuperAdmin ?? false;

  // Check if user is apex
  bool get isApex => _user?.isApex ?? false;

  // Check if user is parent organization
  bool get isParentOrganization => _user?.isParentOrganization ?? false;
}
