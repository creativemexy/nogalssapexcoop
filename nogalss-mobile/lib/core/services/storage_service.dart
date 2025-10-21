import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';

class StorageService {
  static const String _userKey = 'user_data';
  static const String _themeKey = 'theme_mode';
  static const String _languageKey = 'language';
  static const String _biometricKey = 'biometric_enabled';
  static const String _notificationsKey = 'notifications_enabled';

  // User Data Methods
  Future<void> saveUser(UserModel user) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = jsonEncode(user.toJson());
      await prefs.setString(_userKey, userJson);
    } catch (e) {
      throw Exception('Failed to save user data: $e');
    }
  }

  Future<UserModel?> getUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString(_userKey);
      
      if (userJson != null) {
        final userMap = jsonDecode(userJson) as Map<String, dynamic>;
        return UserModel.fromJson(userMap);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<void> clearUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_userKey);
    } catch (e) {
      // Handle error silently
    }
  }

  // Theme Methods
  Future<void> saveThemeMode(String themeMode) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_themeKey, themeMode);
    } catch (e) {
      throw Exception('Failed to save theme mode: $e');
    }
  }

  Future<String?> getThemeMode() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_themeKey);
    } catch (e) {
      return null;
    }
  }

  // Language Methods
  Future<void> saveLanguage(String languageCode) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_languageKey, languageCode);
    } catch (e) {
      throw Exception('Failed to save language: $e');
    }
  }

  Future<String?> getLanguage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_languageKey);
    } catch (e) {
      return null;
    }
  }

  // Biometric Methods
  Future<void> setBiometricEnabled(bool enabled) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_biometricKey, enabled);
    } catch (e) {
      throw Exception('Failed to save biometric setting: $e');
    }
  }

  Future<bool> isBiometricEnabled() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool(_biometricKey) ?? false;
    } catch (e) {
      return false;
    }
  }

  // Notification Methods
  Future<void> setNotificationsEnabled(bool enabled) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_notificationsKey, enabled);
    } catch (e) {
      throw Exception('Failed to save notification setting: $e');
    }
  }

  Future<bool> areNotificationsEnabled() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool(_notificationsKey) ?? true;
    } catch (e) {
      return true;
    }
  }

  // Generic Methods
  Future<void> saveString(String key, String value) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(key, value);
    } catch (e) {
      throw Exception('Failed to save string: $e');
    }
  }

  Future<String?> getString(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(key);
    } catch (e) {
      return null;
    }
  }

  Future<void> saveBool(String key, bool value) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(key, value);
    } catch (e) {
      throw Exception('Failed to save boolean: $e');
    }
  }

  Future<bool?> getBool(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool(key);
    } catch (e) {
      return null;
    }
  }

  Future<void> saveInt(String key, int value) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(key, value);
    } catch (e) {
      throw Exception('Failed to save integer: $e');
    }
  }

  Future<int?> getInt(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getInt(key);
    } catch (e) {
      return null;
    }
  }

  Future<void> saveDouble(String key, double value) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setDouble(key, value);
    } catch (e) {
      throw Exception('Failed to save double: $e');
    }
  }

  Future<double?> getDouble(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getDouble(key);
    } catch (e) {
      return null;
    }
  }

  Future<void> saveStringList(String key, List<String> value) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(key, value);
    } catch (e) {
      throw Exception('Failed to save string list: $e');
    }
  }

  Future<List<String>?> getStringList(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getStringList(key);
    } catch (e) {
      return null;
    }
  }

  Future<void> remove(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(key);
    } catch (e) {
      throw Exception('Failed to remove key: $e');
    }
  }

  Future<void> clear() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.clear();
    } catch (e) {
      throw Exception('Failed to clear storage: $e');
    }
  }

  // Cache Methods
  Future<void> saveCacheData(String key, Map<String, dynamic> data, {Duration? expiry}) async {
    try {
      final cacheData = {
        'data': data,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        'expiry': expiry?.inMilliseconds,
      };
      final jsonString = jsonEncode(cacheData);
      await saveString('cache_$key', jsonString);
    } catch (e) {
      throw Exception('Failed to save cache data: $e');
    }
  }

  Future<Map<String, dynamic>?> getCacheData(String key) async {
    try {
      final jsonString = await getString('cache_$key');
      if (jsonString != null) {
        final cacheData = jsonDecode(jsonString) as Map<String, dynamic>;
        final timestamp = cacheData['timestamp'] as int;
        final expiry = cacheData['expiry'] as int?;
        
        // Check if data has expired
        if (expiry != null) {
          final now = DateTime.now().millisecondsSinceEpoch;
          if (now - timestamp > expiry) {
            await remove('cache_$key');
            return null;
          }
        }
        
        return cacheData['data'] as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<void> clearCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      for (final key in keys) {
        if (key.startsWith('cache_')) {
          await prefs.remove(key);
        }
      }
    } catch (e) {
      // Handle error silently
    }
  }
}
