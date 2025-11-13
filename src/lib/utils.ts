import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Strong password policy enforcement
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
}

/**
 * Comprehensive password validation with detailed error messages
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong' = 'weak';
  let score = 0;

  // Minimum length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  // Maximum length check (prevent DoS)
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  } else {
    score += 1;
  }

  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  } else {
    score += 1;
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  } else {
    score += 1;
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  } else {
    score += 1;
  }

  // Check for common weak patterns
  const commonPatterns = [
    /(.)\1{2,}/, // Same character repeated 3+ times (e.g., "aaa")
    /(012|123|234|345|456|567|678|789|890)/, // Sequential numbers
    /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i, // Sequential letters
    /(qwerty|asdfgh|zxcvbn|password|admin|12345678)/i, // Common passwords
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns that are easy to guess');
      break;
    }
  }

  // Determine strength based on score and length
  if (score >= 5 && password.length >= 12) {
    strength = 'very-strong';
  } else if (score >= 5 && password.length >= 10) {
    strength = 'strong';
  } else if (score >= 4) {
    strength = 'medium';
  } else {
    strength = 'weak';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Simple boolean check for password strength (backward compatibility)
 */
export function isStrongPassword(password: string): boolean {
  const validation = validatePassword(password);
  return validation.isValid;
}

/**
 * Get user-friendly password policy message
 */
export function getPasswordPolicyMessage(): string {
  return 'Password must meet the following requirements:\n' +
    '• At least 8 characters long\n' +
    '• At least one uppercase letter (A-Z)\n' +
    '• At least one lowercase letter (a-z)\n' +
    '• At least one number (0-9)\n' +
    '• At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)';
}

/**
 * Get detailed password policy message with all requirements
 */
export function getDetailedPasswordPolicyMessage(): string {
  return 'Password Requirements:\n' +
    '• Minimum 8 characters (recommended: 12+ for stronger security)\n' +
    '• Maximum 128 characters\n' +
    '• At least one uppercase letter (A-Z)\n' +
    '• At least one lowercase letter (a-z)\n' +
    '• At least one number (0-9)\n' +
    '• At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)\n' +
    '• Avoid common patterns, sequential characters, or repeated characters';
}

/**
 * Generate a secure random password that meets all complexity requirements
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + special;

  // Ensure at least one character from each required set
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// TOTP 2FA utilities
import { authenticator } from 'otplib';
import qrcode from 'qrcode';

export function generateTOTPSecret(userEmail: string, issuer = 'Nogalss Cooperative'): { secret: string, otpauthUrl: string } {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(userEmail, issuer, secret);
  return { secret, otpauthUrl };
}

export async function generateTOTPQrDataUrl(otpauthUrl: string): Promise<string> {
  return await qrcode.toDataURL(otpauthUrl);
}

export function verifyTOTPToken(secret: string, token: string): boolean {
  return authenticator.check(token, secret);
} 