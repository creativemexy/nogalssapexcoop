import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 

// Strong password validator: 12+ chars, upper, lower, digit, special
export function isStrongPassword(password: string): boolean {
  if (typeof password !== 'string') return false;
  if (password.length < 12) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUppercase && hasLowercase && hasDigit && hasSpecial;
}

export function getPasswordPolicyMessage(): string {
  return 'Password must be at least 12 characters and include uppercase, lowercase, number, and special character.';
}