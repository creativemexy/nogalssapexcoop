# Nogalss Mobile App

Flutter mobile application for Nogalss National Apex Cooperative Society Ltd. This app provides access to member and leader dashboards, allowing users to manage contributions, loans, and withdrawals.

## Features

### For Members
- View total contributions and available loan amount
- Make contributions via Paystack
- View contribution history
- View loan applications and status
- Request withdrawals
- View virtual account details

### For Leaders
- View cooperative statistics (total members, contributions, pending loans)
- View allocation percentage
- Manage members
- View contributions
- Approve/reject loans
- Personal account management

## Setup

1. **Install Flutter dependencies:**
   ```bash
   flutter pub get
   ```

2. **Configure API Base URL:**
   
   Update the `baseUrl` in `lib/core/config/app_config.dart`:
   ```dart
   static const String baseUrl = 'https://your-domain.com';
   ```
   
   Or use environment variable:
   ```bash
   flutter run --dart-define=API_BASE_URL=https://your-domain.com
   ```

3. **Add Logo Asset (Optional):**
   
   Place your logo at `assets/images/logo.png`. If not provided, the app will use a default icon.

4. **Run the app:**
   ```bash
   flutter run
   ```

## Authentication

The app uses the same authentication system as the web version:
- Login with email, phone number, or NIN
- Password authentication
- 2FA support (TOTP)
- NextAuth JWT tokens for API authentication

## API Endpoints

The app uses the same API endpoints as the web version:

### Authentication
- `POST /api/auth/mobile/login` - Mobile login

### Member APIs
- `GET /api/member/contributions` - Get contributions
- `GET /api/member/virtual-account` - Get virtual account
- `GET /api/member/cooperative` - Get cooperative info
- `GET /api/member/loan-eligibility` - Get loan eligibility
- `GET /api/member/loans` - Get loans
- `POST /api/member/contribute` - Make contribution
- `POST /api/member/withdraw` - Request withdrawal
- `GET /api/member/withdrawals` - Get withdrawals
- `POST /api/member/apply-loan` - Apply for loan

### Leader APIs
- `GET /api/leader/dashboard-stats` - Dashboard statistics
- `GET /api/leader/allocations` - Get allocations
- `GET /api/leader/contributions` - Get contributions
- `GET /api/leader/loans` - Get loans
- `GET /api/leader/members` - Get members
- `POST /api/leader/loans/:id/approve` - Approve loan
- `POST /api/leader/loans/:id/reject` - Reject loan

## Project Structure

```
lib/
├── core/
│   ├── config/          # App configuration
│   ├── models/          # Data models
│   ├── providers/       # State management (Provider)
│   ├── routing/         # Navigation (GoRouter)
│   ├── services/        # API and storage services
│   └── utils/           # Utility functions
├── features/
│   ├── auth/            # Authentication screens
│   ├── dashboard/       # Dashboard screens
│   ├── contributions/   # Contribution screens
│   ├── loans/           # Loan screens
│   └── withdrawals/     # Withdrawal screens
└── shared/              # Shared components and screens
```

## Dependencies

- `dio` - HTTP client
- `provider` - State management
- `go_router` - Navigation
- `flutter_secure_storage` - Secure token storage
- `shared_preferences` - User data storage
- `intl` - Date/number formatting
- `url_launcher` - Open payment URLs

## Building

### Android
```bash
flutter build apk
```

### iOS
```bash
flutter build ios
```

## Notes

- The app only supports MEMBER and LEADER roles
- All API calls use Bearer token authentication
- Tokens are stored securely using FlutterSecureStorage
- The app matches the web version's functionality and API endpoints
