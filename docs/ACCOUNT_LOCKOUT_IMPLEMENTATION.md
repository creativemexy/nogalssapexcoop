# Account Lockout Implementation

## Overview
This document describes the account lockout feature that prevents brute force attacks by locking user accounts after multiple failed login attempts.

## Configuration

The account lockout is configured in `src/lib/account-lockout.ts`:

- **MAX_FAILED_ATTEMPTS**: 5 failed attempts before lockout
- **LOCKOUT_DURATION_MINUTES**: 30 minutes lockout duration
- **RESET_ATTEMPTS_AFTER_MINUTES**: 15 minutes - attempts counter resets if no attempts for this duration

## Database Schema

Added fields to the `User` model:

```prisma
failedLoginAttempts Int      @default(0)
accountLockedUntil DateTime?
lastFailedLoginAttempt DateTime?
```

## Implementation Details

### 1. Account Lockout Utility (`src/lib/account-lockout.ts`)

Provides the following functions:

- `isAccountLocked(userId)`: Checks if an account is currently locked
- `getRemainingLockoutTime(userId)`: Returns remaining lockout time in minutes
- `recordFailedLoginAttempt(userId)`: Records a failed attempt and locks account if threshold reached
- `resetFailedLoginAttempts(userId)`: Resets attempts on successful login
- `unlockAccount(userId)`: Manually unlock an account (admin function)
- `getAccountLockoutStatus(userId)`: Get detailed lockout status

### 2. Authentication Integration

#### NextAuth Credentials Provider (`src/lib/auth.ts`)
- Checks for account lockout before password verification
- Records failed attempts on invalid password
- Resets attempts on successful login
- Throws descriptive error messages for locked accounts

#### Mobile Login API (`src/app/api/auth/mobile/login/route.ts`)
- Same lockout logic as NextAuth
- Returns HTTP 423 (Locked) status for locked accounts
- Includes `remainingAttempts` in error responses

#### Identity Service (`src/lib/identity-service.ts`)
- Integrated lockout checks in the login method
- Records and resets attempts appropriately

### 3. Admin API

#### Unlock Account Endpoint (`src/app/api/admin/users/unlock-account/route.ts`)

**POST** `/api/admin/users/unlock-account`
- Unlocks a user account
- Requires SUPER_ADMIN role
- Logs the unlock action

**GET** `/api/admin/users/unlock-account?userId=xxx`
- Gets account lockout status
- Requires SUPER_ADMIN role
- Returns detailed lockout information

### 4. Frontend Updates

#### Sign In Page (`src/app/auth/signin/page.tsx`)
- Displays account lockout error messages
- Shows remaining lockout time when account is locked

## Security Features

1. **Automatic Lockout**: Accounts are automatically locked after 5 failed attempts
2. **Time-based Lockout**: Accounts remain locked for 30 minutes
3. **Attempt Counter Reset**: Counter resets after 15 minutes of no attempts
4. **Auto-unlock**: Accounts automatically unlock after lockout period expires
5. **Admin Override**: Super admins can manually unlock accounts
6. **Audit Logging**: All unlock actions are logged

## Error Messages

### User-facing Messages:
- "Account locked due to too many failed login attempts. Please try again in X minute(s) or contact support."
- "Too many failed login attempts. Account locked for X minute(s). Please try again later or contact support."

### API Responses:
- HTTP 423 (Locked) for locked accounts
- Includes `code: 'ACCOUNT_LOCKED'` and `remainingMinutes` in response

## Migration

To apply the database changes:

```bash
npx prisma migrate deploy
# or for development:
npx prisma db push
```

The migration file is located at:
`prisma/migrations/20241107000000_add_account_lockout/migration.sql`

## Testing

### Test Scenarios:

1. **Normal Login**: Successful login resets failed attempts
2. **Failed Attempts**: Each failed attempt increments counter
3. **Lockout Trigger**: After 5 failed attempts, account is locked
4. **Lockout Duration**: Account remains locked for 30 minutes
5. **Auto-unlock**: Account automatically unlocks after 30 minutes
6. **Admin Unlock**: Super admin can unlock accounts immediately
7. **Attempt Reset**: Counter resets after 15 minutes of no attempts

### Manual Testing:

1. Attempt to login with wrong password 5 times
2. Verify account is locked
3. Attempt to login - should see lockout message
4. Wait 30 minutes or use admin unlock
5. Verify account can login again

## Future Enhancements

- [ ] Configurable lockout thresholds via system settings
- [ ] Email notification on account lockout
- [ ] IP-based lockout (lock IP after multiple failed attempts)
- [ ] Progressive lockout (increase lockout duration with repeated lockouts)
- [ ] Account lockout dashboard for admins
- [ ] Unlock via email link

## Notes

- Failed attempts are tracked per user account
- Lockout applies to all login methods (email, phone, NIN)
- Lockout does not affect password reset functionality
- 2FA failures do not count as failed login attempts (only password failures)

