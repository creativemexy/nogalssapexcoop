import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Invalid email format').max(255, 'Email too long');
const phoneSchema = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format').max(20);
const nameSchema = z.string().min(1, 'Name is required').max(100, 'Name too long').regex(/^[a-zA-Z\s\-'\.]+$/, 'Name contains invalid characters');
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain uppercase, lowercase, number, and special character');

// Sanitization functions
export function sanitizeString(input: string): string {
  // Keep it conservative: trim, collapse whitespace, and strip angle brackets.
  // Avoid over-aggressive stripping that can erase valid names/addresses.
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function sanitizePhone(input: string): string {
  return input.replace(/[^\d+]/g, ''); // Keep only digits and plus sign
}

// User validation schemas
export const createUserSchema = z.object({
  firstName: nameSchema.transform(sanitizeString),
  lastName: nameSchema.transform(sanitizeString),
  email: emailSchema.transform(sanitizeEmail),
  password: passwordSchema,
  phoneNumber: phoneSchema.optional().transform(sanitizePhone),
  dateOfBirth: z.string().datetime().optional(),
  address: z.string().max(500, 'Address too long').optional().transform(sanitizeString),
  role: z.enum(['SUPER_ADMIN', 'APEX', 'LEADER', 'COOPERATIVE', 'MEMBER', 'BUSINESS', 'FINANCE', 'APEX_FUNDS', 'NOGALSS_FUNDS']),
});

export const updateUserSchema = z.object({
  firstName: nameSchema.transform(sanitizeString).optional(),
  lastName: nameSchema.transform(sanitizeString).optional(),
  email: emailSchema.transform(sanitizeEmail).optional(),
  phoneNumber: phoneSchema.optional().transform(sanitizePhone),
  dateOfBirth: z.string().datetime().optional(),
  address: z.string().max(500, 'Address too long').optional().transform(sanitizeString),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Cooperative validation schemas
export const createCooperativeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long').transform(sanitizeString),
  registrationNumber: z.string().min(1, 'Registration number is required').max(50, 'Registration number too long').transform(sanitizeString),
  address: z.string().min(1, 'Address is required').max(500, 'Address too long').transform(sanitizeString),
  phoneNumber: phoneSchema,
  email: emailSchema.transform(sanitizeEmail),
  description: z.string().max(1000, 'Description too long').optional().transform(sanitizeString),
  stateId: z.string().min(1, 'State is required'),
  lgaId: z.string().min(1, 'LGA is required'),
});

export const updateCooperativeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long').transform(sanitizeString).optional(),
  address: z.string().min(1, 'Address is required').max(500, 'Address too long').transform(sanitizeString).optional(),
  phoneNumber: phoneSchema.optional(),
  email: emailSchema.transform(sanitizeEmail).optional(),
  description: z.string().max(1000, 'Description too long').optional().transform(sanitizeString),
  isActive: z.boolean().optional(),
});

// Business validation schemas
export const createBusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(200, 'Business name too long').transform(sanitizeString),
  registrationNumber: z.string().min(1, 'Registration number is required').max(50, 'Registration number too long').transform(sanitizeString),
  businessType: z.string().min(1, 'Business type is required').max(100, 'Business type too long').transform(sanitizeString),
  address: z.string().min(1, 'Address is required').max(500, 'Address too long').transform(sanitizeString),
  phoneNumber: phoneSchema,
  email: emailSchema.transform(sanitizeEmail),
  description: z.string().max(1000, 'Description too long').optional().transform(sanitizeString),
});

// Financial validation schemas
export const createTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(1000000000, 'Amount too large'),
  description: z.string().max(500, 'Description too long').transform(sanitizeString),
  type: z.enum(['CREDIT', 'DEBIT']),
  reference: z.string().max(100, 'Reference too long').transform(sanitizeString),
  category: z.string().max(100, 'Category too long').optional().transform(sanitizeString),
});

export const createLoanSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(10000000, 'Amount too large'),
  interestRate: z.number().min(0).max(100, 'Interest rate must be between 0 and 100'),
  duration: z.number().positive('Duration must be positive').max(120, 'Duration too long (max 120 months)'),
  purpose: z.string().max(500, 'Purpose too long').transform(sanitizeString),
  collateral: z.string().max(500, 'Collateral description too long').optional().transform(sanitizeString),
});

// Payment validation schemas
export const createPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(1000000000, 'Amount too large'),
  reference: z.string().max(100, 'Reference too long').transform(sanitizeString),
  description: z.string().max(500, 'Description too long').transform(sanitizeString),
  paymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'CASH', 'MOBILE_MONEY']),
});

// Search and pagination schemas
export const searchSchema = z.object({
  search: z.string().max(100, 'Search term too long').optional().transform(sanitizeString),
  page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).refine(val => val >= 1, 'Page must be at least 1'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
});

// 2FA validation schemas
export const setup2FASchema = z.object({
  totp: z.string().length(6, 'TOTP code must be 6 digits').regex(/^\d{6}$/, 'TOTP code must contain only digits'),
});

export const confirm2FASchema = z.object({
  totp: z.string().length(6, 'TOTP code must be 6 digits').regex(/^\d{6}$/, 'TOTP code must contain only digits'),
});

// Impersonation validation schemas
export const impersonateSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
  reason: z.string().max(500, 'Reason too long').transform(sanitizeString),
});

// Settings validation schemas
export const updateSettingsSchema = z.object({
  key: z.string().min(1, 'Setting key is required').max(100, 'Key too long').transform(sanitizeString),
  value: z.string().max(1000, 'Value too long').transform(sanitizeString),
});

// Generic validation function
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      success: false,
      errors: ['Validation failed']
    };
  }
}

// Validation middleware helper
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown) => validateInput(schema, data);
}
