# Password Expiration Policy Implementation

## Overview
This document describes the password expiration feature that enforces periodic password changes for enhanced security.

## Configuration

The password expiration policy is configurable via system settings:

- **PASSWORD_EXPIRATION_ENABLED**: Enable/disable password expiration (default: false)
- **PASSWORD_EXPIRATION_DAYS**: Number of days before password expires (default: 90)
- **PASSWORD_EXPIRATION_WARNING_DAYS**: Days before expiration to show warning (default: 7)
- **PASSWORD_EXPIRATION_FORCE_CHANGE**: Force password change when expired (default: true)

## Database Schema

Added fields to the `User` model:

```prisma
passwordChangedAt DateTime?
passwordExpiresAt DateTime?
passwordExpired   Boolean @default(false)
```

## Implementation Details

### 1. Password Expiration Utility (`src/lib/password-expiration.ts`)

Provides the following functions:

- `getPasswordExpirationPolicy()`: Get current policy from system settings
- `calculatePasswordExpirationDate()`: Calculate expiration date based on policy
- `isPasswordExpired(userId)`: Check if user's password is expired
- `getPasswordExpirationStatus(userId)`: Get detailed expiration status
- `updatePasswordExpiration(userId)`: Update expiration after password change
- `initializePasswordExpirationForUser(userId)`: Initialize expiration for existing users

### 2. Authentication Integration

#### NextAuth Credentials Provider (`src/lib/auth.ts`)
- Checks for password expiration after successful authentication
- Blocks login if password is expired
- Throws descriptive error message

#### Mobile Login API (`src/app/api/auth/mobile/login/route.ts`)
- Same expiration check as NextAuth
- Returns HTTP 403 (Forbidden) for expired passwords
- Includes `code: 'PASSWORD_EXPIRED'` in response

### 3. Password Change Integration

All password change/reset endpoints update expiration:

- `/api/admin/change-password` - User password change
- `/api/password-reset` - Password reset via token
- `/api/auth/reset-password` - Alternative reset endpoint

### 4. API Endpoints

#### User Password Expiration Status
**GET** `/api/user/password-expiration`
- Returns expiration status for current user
- Includes: isExpired, expiresAt, daysUntilExpiration, isWarningActive

#### Admin Password Expiration Policy
**GET** `/api/admin/password-expiration-policy`
- Get current policy settings (SUPER_ADMIN only)

**POST** `/api/admin/password-expiration-policy`
- Update policy settings (SUPER_ADMIN only)
- Body: `{ enabled, expirationDays, warningDays, forceChange }`

### 5. Frontend Updates

#### Sign In Page (`src/app/auth/signin/page.tsx`)
- Detects password expiration errors
- Shows appropriate error message
- Redirects to password reset after 3 seconds

## Security Features

1. **Automatic Expiration**: Passwords expire based on configured policy
2. **Login Blocking**: Users cannot login with expired passwords
3. **Warning System**: Users are warned before expiration
4. **Force Change**: Expired passwords require immediate change
5. **Policy Configuration**: Admins can configure expiration settings
6. **Audit Logging**: Policy changes are logged

## Error Messages

### User-facing Messages:
- "Your password has expired. Please change your password to continue."
- "Your password will expire in X days. Please change it soon."

### API Responses:
- HTTP 403 (Forbidden) for expired passwords
- Includes `code: 'PASSWORD_EXPIRED'` and `daysExpired` in response

## Migration

To apply the database changes:

```bash
npx prisma migrate deploy
# or for development:
npx prisma db push
```

The migration file is located at:
`prisma/migrations/20241107000001_add_password_expiration/migration.sql`

## Initialization

For existing users, you may want to initialize password expiration:

```typescript
import { initializePasswordExpirationForUser } from '@/lib/password-expiration';

// Initialize for a specific user
await initializePasswordExpirationForUser(userId);

// Or for all users (run as a script)
const users = await prisma.user.findMany({ select: { id: true } });
for (const user of users) {
  await initializePasswordExpirationForUser(user.id);
}
```

## Testing

### Test Scenarios:

1. **Normal Login**: Users with non-expired passwords can login
2. **Expired Password**: Users with expired passwords cannot login
3. **Password Change**: Changing password resets expiration
4. **Warning Display**: Warnings shown before expiration
5. **Policy Update**: Admin can update expiration policy
6. **Policy Disable**: Disabling policy allows expired passwords

### Manual Testing:

1. Set expiration to 1 day for testing
2. Wait for password to expire
3. Attempt to login - should be blocked
4. Reset password - should be able to login
5. Verify expiration date is updated

## Future Enhancements

- [ ] Password expiration warning banner on dashboard
- [ ] Email notifications before expiration
- [ ] Password history to prevent reuse
- [ ] Grace period for expired passwords
- [ ] Different expiration policies per role
- [ ] Password expiration dashboard for admins

## Notes

- Password expiration is checked after successful authentication
- Expired passwords block all login methods (email, phone, NIN)
- Password reset clears expiration and sets new expiration date
- Policy can be disabled to allow expired passwords
- Expiration is calculated from `passwordChangedAt` or `createdAt` if not set

