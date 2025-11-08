class UserModel {
  final String id;
  final String email;
  final String name;
  final String firstName;
  final String lastName;
  final String? phoneNumber;
  final String role;
  final String? cooperativeId;
  final String? businessId;
  final bool isActive;
  final bool isVerified;
  final bool twoFactorEnabled;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.firstName,
    required this.lastName,
    this.phoneNumber,
    required this.role,
    this.cooperativeId,
    this.businessId,
    this.isActive = true,
    this.isVerified = true,
    this.twoFactorEnabled = false,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    // Handle partial user data from login API
    String firstName = json['firstName'] ?? '';
    String lastName = json['lastName'] ?? '';

    if (firstName.isEmpty && lastName.isEmpty && json['name'] != null) {
      final nameStr = json['name'].toString();
      final nameParts = nameStr.split(' ');
      if (nameParts.isNotEmpty) {
        firstName = nameParts[0];
        if (nameParts.length > 1) {
          lastName = nameParts.sublist(1).join(' ');
        }
      }
    }

    return UserModel(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      name: json['name']?.toString() ?? '$firstName $lastName',
      firstName: firstName,
      lastName: lastName,
      phoneNumber: json['phoneNumber']?.toString(),
      role: json['role']?.toString() ?? 'MEMBER',
      cooperativeId: json['cooperativeId']?.toString(),
      businessId: json['businessId']?.toString(),
      isActive: json['isActive'] ?? true,
      isVerified: json['isVerified'] ?? true,
      twoFactorEnabled: json['twoFactorEnabled'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'firstName': firstName,
      'lastName': lastName,
      'phoneNumber': phoneNumber,
      'role': role,
      'cooperativeId': cooperativeId,
      'businessId': businessId,
      'isActive': isActive,
      'isVerified': isVerified,
      'twoFactorEnabled': twoFactorEnabled,
    };
  }
}
