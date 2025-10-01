import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Strong password policy enforcement
export function isStrongPassword(password: string): boolean {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
}

export function getPasswordPolicyMessage(): string {
  return 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.';
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