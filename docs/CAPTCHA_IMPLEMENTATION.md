# CAPTCHA Implementation for Login Attempts

## Overview

This document describes the CAPTCHA implementation that protects login attempts after multiple failed authentication attempts. The system uses Google reCAPTCHA v2 (checkbox) to prevent automated brute force attacks.

## Features

- **Automatic CAPTCHA Trigger**: CAPTCHA is required after 3 failed login attempts
- **User-Friendly**: Only shows CAPTCHA when necessary, doesn't block legitimate users
- **Backend Verification**: All CAPTCHA tokens are verified server-side
- **Mobile Support**: CAPTCHA verification is also implemented for mobile login endpoints

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Google reCAPTCHA v2
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

### Getting reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Create a new site
3. Select **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
4. Add your domain(s)
5. Copy the **Site Key** and **Secret Key**

## How It Works

### 1. Failed Attempt Tracking

The system tracks failed login attempts per user using the existing `failedLoginAttempts` field in the `User` model.

### 2. CAPTCHA Requirement Check

When a user attempts to log in:
- The system checks the number of failed attempts for that user
- If failed attempts ≥ 3, CAPTCHA is required
- The frontend calls `/api/auth/check-captcha-required` to determine if CAPTCHA should be shown

### 3. CAPTCHA Display

- The reCAPTCHA widget is dynamically loaded and rendered when required
- The widget appears below the 2FA code field (if present) or password field
- Users must complete the CAPTCHA before submitting the login form

### 4. Backend Verification

- When CAPTCHA is required, the token is sent with the login request
- The backend verifies the token with Google's reCAPTCHA API
- Invalid or missing CAPTCHA tokens result in a failed login attempt

## API Endpoints

### Check CAPTCHA Requirement

**POST** `/api/auth/check-captcha-required`

Request body:
```json
{
  "email": "user@example.com",
  "phone": "+2348012345678",
  "nin": "12345678901"
}
```

Response:
```json
{
  "captchaRequired": true,
  "failedAttempts": 3
}
```

## Implementation Details

### Frontend (`src/app/auth/signin/page.tsx`)

- Dynamically loads reCAPTCHA script
- Checks CAPTCHA requirement when email/phone/NIN is entered
- Renders CAPTCHA widget when required
- Validates CAPTCHA token before form submission
- Resets CAPTCHA on successful login

### Backend Authentication (`src/lib/auth.ts`)

- Checks if CAPTCHA is required based on failed attempts
- Verifies CAPTCHA token before password validation
- Records failed attempt if CAPTCHA is invalid
- Throws `CAPTCHA_REQUIRED` error if CAPTCHA is missing when required

### Mobile Login (`src/app/api/auth/mobile/login/route.ts`)

- Same CAPTCHA verification logic as web login
- Returns `CAPTCHA_REQUIRED` error code for mobile clients
- Mobile clients should implement reCAPTCHA widget or use alternative verification

## Security Considerations

1. **Server-Side Verification**: All CAPTCHA tokens are verified server-side with Google's API
2. **Failed Attempt Tracking**: Failed CAPTCHA attempts count toward the lockout threshold
3. **Token Expiration**: CAPTCHA tokens expire after a short period (handled by Google)
4. **Graceful Degradation**: If reCAPTCHA keys are not configured, the system allows login (with a warning)

## Testing

### Test CAPTCHA Requirement

1. Attempt to log in with incorrect credentials 3 times
2. On the 4th attempt, CAPTCHA should appear
3. Complete the CAPTCHA and attempt login
4. If CAPTCHA is invalid, it should reset and require completion again

### Test Without CAPTCHA Keys

If `RECAPTCHA_SECRET_KEY` is not set:
- System logs a warning
- CAPTCHA verification is skipped (returns `true`)
- Login proceeds normally

## Troubleshooting

### CAPTCHA Not Showing

1. Check that `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set
2. Verify the reCAPTCHA script is loading (check browser console)
3. Ensure the domain is registered in Google reCAPTCHA console

### CAPTCHA Verification Failing

1. Check that `RECAPTCHA_SECRET_KEY` is set correctly
2. Verify the secret key matches the site key
3. Check server logs for Google API errors

### Mobile App Integration

For mobile apps, you can:
1. Use Google's reCAPTCHA mobile SDK
2. Implement a custom CAPTCHA solution
3. Use alternative verification methods (SMS, email verification)

## Future Enhancements

- [ ] Configurable threshold for CAPTCHA requirement (currently hardcoded to 3)
- [ ] IP-based CAPTCHA requirement (in addition to user-based)
- [ ] Rate limiting per IP address
- [ ] Alternative CAPTCHA providers (hCaptcha, Cloudflare Turnstile)

