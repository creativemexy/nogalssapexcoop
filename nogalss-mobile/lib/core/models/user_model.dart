class UserModel {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String phoneNumber;
  final String role;
  final String status;
  final String? cooperativeId;
  final String? parentOrganizationId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isActive;
  final bool isVerified;
  final bool twoFactorEnabled;
  final String? profileImage;
  final String? address;
  final DateTime? dateOfBirth;
  final String? nextOfKinName;
  final String? nextOfKinPhone;

  UserModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phoneNumber,
    required this.role,
    required this.status,
    this.cooperativeId,
    this.parentOrganizationId,
    required this.createdAt,
    required this.updatedAt,
    required this.isActive,
    required this.isVerified,
    required this.twoFactorEnabled,
    this.profileImage,
    this.address,
    this.dateOfBirth,
    this.nextOfKinName,
    this.nextOfKinPhone,
  });

  String get fullName => '$firstName $lastName';

  bool get isMember => role == 'MEMBER';
  bool get isLeader => role == 'LEADER';
  bool get isCooperative => role == 'COOPERATIVE';
  bool get isSuperAdmin => role == 'SUPER_ADMIN';
  bool get isApex => role == 'APEX';
  bool get isParentOrganization => role == 'PARENT_ORGANIZATION';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      email: json['email'] ?? '',
      phoneNumber: json['phoneNumber'] ?? '',
      role: json['role'] ?? '',
      status: json['status'] ?? '',
      cooperativeId: json['cooperativeId'],
      parentOrganizationId: json['parentOrganizationId'],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
      isActive: json['isActive'] ?? false,
      isVerified: json['isVerified'] ?? false,
      twoFactorEnabled: json['twoFactorEnabled'] ?? false,
      profileImage: json['profileImage'],
      address: json['address'],
      dateOfBirth: json['dateOfBirth'] != null ? DateTime.parse(json['dateOfBirth']) : null,
      nextOfKinName: json['nextOfKinName'],
      nextOfKinPhone: json['nextOfKinPhone'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'phoneNumber': phoneNumber,
      'role': role,
      'status': status,
      'cooperativeId': cooperativeId,
      'parentOrganizationId': parentOrganizationId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'isActive': isActive,
      'isVerified': isVerified,
      'twoFactorEnabled': twoFactorEnabled,
      'profileImage': profileImage,
      'address': address,
      'dateOfBirth': dateOfBirth?.toIso8601String(),
      'nextOfKinName': nextOfKinName,
      'nextOfKinPhone': nextOfKinPhone,
    };
  }

  UserModel copyWith({
    String? id,
    String? firstName,
    String? lastName,
    String? email,
    String? phoneNumber,
    String? role,
    String? status,
    String? cooperativeId,
    String? parentOrganizationId,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isActive,
    bool? isVerified,
    bool? twoFactorEnabled,
    String? profileImage,
    String? address,
    DateTime? dateOfBirth,
    String? nextOfKinName,
    String? nextOfKinPhone,
  }) {
    return UserModel(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      role: role ?? this.role,
      status: status ?? this.status,
      cooperativeId: cooperativeId ?? this.cooperativeId,
      parentOrganizationId: parentOrganizationId ?? this.parentOrganizationId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isActive: isActive ?? this.isActive,
      isVerified: isVerified ?? this.isVerified,
      twoFactorEnabled: twoFactorEnabled ?? this.twoFactorEnabled,
      profileImage: profileImage ?? this.profileImage,
      address: address ?? this.address,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      nextOfKinName: nextOfKinName ?? this.nextOfKinName,
      nextOfKinPhone: nextOfKinPhone ?? this.nextOfKinPhone,
    );
  }
}
