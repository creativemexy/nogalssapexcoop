import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class UserProvider extends ChangeNotifier {
  final ApiService _apiService;
  
  UserProvider(this._apiService);
  
  // Add your user-related state and methods here
}