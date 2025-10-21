# Nogalss Cooperative Mobile App

A Flutter mobile application for the Nogalss Cooperative Management System, supporting both Android and iOS platforms.

## Features

### Authentication
- User login with email/password
- User registration for new members
- Two-factor authentication (2FA) support
- Password reset functionality
- Biometric authentication support
- Secure token storage

### User Roles
- **Member**: Basic cooperative member features
- **Leader**: Cooperative leader with management capabilities
- **Cooperative**: Cooperative entity dashboard
- **Super Admin**: System administration
- **Apex**: Apex level management
- **Parent Organization**: Parent organization management

### Core Features
- **Dashboard**: Role-based dashboard for each user type
- **Contributions**: Make and track contributions
- **Loans**: Apply for and manage loans
- **Profile Management**: Update personal information
- **Settings**: App preferences and security settings
- **Notifications**: Push notifications for important updates

## Project Structure

```
lib/
├── core/                    # Core application logic
│   ├── config/             # App configuration
│   ├── models/             # Data models
│   ├── providers/          # State management
│   ├── routing/            # Navigation routing
│   ├── services/           # API and storage services
│   ├── theme/              # App theming
│   └── utils/              # Utility functions
├── features/               # Feature-based modules
│   ├── auth/               # Authentication features
│   ├── dashboard/          # Dashboard features
│   ├── profile/            # Profile management
│   ├── contributions/      # Contribution features
│   ├── loans/              # Loan management
│   └── settings/           # App settings
└── shared/                 # Shared components
    ├── widgets/            # Reusable widgets
    ├── components/         # UI components
    └── utils/              # Shared utilities
```

## Dependencies

### Core Dependencies
- **flutter**: SDK
- **provider**: State management
- **go_router**: Navigation routing
- **http**: HTTP client
- **dio**: Advanced HTTP client

### Storage & Security
- **shared_preferences**: Local storage
- **flutter_secure_storage**: Secure storage
- **local_auth**: Biometric authentication

### UI & UX
- **flutter_svg**: SVG support
- **cached_network_image**: Image caching
- **shimmer**: Loading animations
- **lottie**: Advanced animations
- **fl_chart**: Charts and graphs

### Forms & Validation
- **flutter_form_builder**: Form building
- **form_builder_validators**: Form validation

### Notifications & Media
- **firebase_core**: Firebase integration
- **firebase_messaging**: Push notifications
- **image_picker**: Image selection
- **qr_flutter**: QR code generation

## Getting Started

### Prerequisites
- Flutter SDK (3.0.0 or higher)
- Dart SDK
- Android Studio / Xcode (for device testing)
- VS Code or Android Studio (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nogalss-mobile
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Configure environment**
   - Copy `.env.example` to `.env`
   - Update API endpoints and configuration

4. **Run the app**
   ```bash
   flutter run
   ```

### Build for Production

**Android APK**
```bash
flutter build apk --release
```

**iOS App**
```bash
flutter build ios --release
```

## Configuration

### API Configuration
Update `lib/core/config/app_config.dart` with your API endpoints:

```dart
static const String baseUrl = 'https://your-api-domain.com/api';
```

### Firebase Setup
1. Add `google-services.json` (Android) to `android/app/`
2. Add `GoogleService-Info.plist` (iOS) to `ios/Runner/`
3. Configure Firebase project settings

### App Icons & Splash Screen
- Update app icons in `assets/images/`
- Modify splash screen in `lib/shared/screens/splash_screen.dart`

## Architecture

### State Management
- **Provider**: Used for state management
- **AuthProvider**: Handles authentication state
- **UserProvider**: Manages user data

### Navigation
- **GoRouter**: Declarative routing
- **Route Guards**: Authentication-based route protection
- **Deep Linking**: Support for deep links

### API Integration
- **RESTful API**: HTTP-based communication
- **Token Authentication**: JWT token-based auth
- **Error Handling**: Comprehensive error management
- **Offline Support**: Local data caching

### Security
- **Secure Storage**: Sensitive data encryption
- **Biometric Auth**: Fingerprint/Face ID support
- **2FA Support**: Two-factor authentication
- **Token Management**: Automatic token refresh

## Development Guidelines

### Code Style
- Follow Flutter/Dart style guidelines
- Use meaningful variable and function names
- Add comments for complex logic
- Maintain consistent indentation

### File Organization
- Feature-based folder structure
- Separate concerns (UI, logic, data)
- Reusable components in `shared/`
- Core functionality in `core/`

### Testing
- Unit tests for business logic
- Widget tests for UI components
- Integration tests for user flows

## Deployment

### Android
1. Generate signed APK
2. Upload to Google Play Store
3. Configure app signing

### iOS
1. Archive the app in Xcode
2. Upload to App Store Connect
3. Submit for review

## Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## License

This project is proprietary software. All rights reserved.

## Version History

- **v1.0.0**: Initial release with core features
- Authentication and user management
- Dashboard for all user roles
- Contribution and loan management
- Profile and settings management