import { z } from 'zod';
import { prisma } from '@/lib/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole } from '@prisma/client';
import { sendMail, getPasswordResetLink } from '@/lib/email';

// Identity Service Configuration
export const IDENTITY_CONFIG = {
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  passwordResetExpiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '1h',
};

// Identity Service Schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional().default(false),
});

export const RegisterSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phoneNumber: z.string().optional(),
  role: z.enum(['MEMBER', 'LEADER', 'COOPERATIVE', 'SUPER_ADMIN']).optional().default('MEMBER'),
  cooperativeId: z.string().optional(),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const PasswordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').refine(
    (password) => {
      // Import here to avoid circular dependency
      const { isStrongPassword } = require('@/lib/utils');
      return isStrongPassword(password);
    },
    {
      message: 'Password must contain uppercase, lowercase, number, and special character',
    }
  ),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').refine(
    (password) => {
      // Import here to avoid circular dependency
      const { isStrongPassword } = require('@/lib/utils');
      return isStrongPassword(password);
    },
    {
      message: 'Password must contain uppercase, lowercase, number, and special character',
    }
  ),
});

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

// Types
export type LoginData = z.infer<typeof LoginSchema>;
export type RegisterData = z.infer<typeof RegisterSchema>;
export type PasswordResetRequestData = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetData = z.infer<typeof PasswordResetSchema>;
export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>;
export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
  cooperativeId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Identity Service Class
export class IdentityService {
  // Generate JWT tokens
  private generateTokens(userId: string, email: string, role: UserRole): AuthTokens {
    const payload = {
      userId,
      email,
      role,
      type: 'access',
    };

    const accessToken = jwt.sign(payload, IDENTITY_CONFIG.jwtSecret, {
      expiresIn: IDENTITY_CONFIG.jwtExpiresIn,
    } as jwt.SignOptions);

    const refreshPayload = {
      userId,
      email,
      role,
      type: 'refresh',
    };

    const refreshToken = jwt.sign(refreshPayload, IDENTITY_CONFIG.jwtSecret, {
      expiresIn: IDENTITY_CONFIG.refreshTokenExpiresIn,
    } as jwt.SignOptions);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getTokenExpiration(IDENTITY_CONFIG.jwtExpiresIn),
    };
  }

  // Get token expiration time in seconds
  private getTokenExpiration(expiresIn: string): number {
    const timeUnits: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const [, amount, unit] = match;
    return parseInt(amount) * (timeUnits[unit] || 1);
  }

  // Verify JWT token
  private verifyToken(token: string): any {
    try {
      return jwt.verify(token, IDENTITY_CONFIG.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // User Registration
  async register(data: RegisterData): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        phoneNumber: data.phoneNumber,
        role: data.role,
        cooperativeId: data.cooperativeId,
      },
    });

    // Initialize password expiration for new user
    const { updatePasswordExpiration } = await import('@/lib/password-expiration');
    await updatePasswordExpiration(user.id);

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        cooperativeId: user.cooperativeId,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
    };
  }

  // User Login
  async login(data: LoginData): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    // Import account lockout functions
    const {
      isAccountLocked,
      recordFailedLoginAttempt,
      resetFailedLoginAttempts,
      getRemainingLockoutTime,
    } = await import('@/lib/account-lockout');

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Check if account is locked
    const accountLocked = await isAccountLocked(user.id);
    if (accountLocked) {
      const remainingMinutes = await getRemainingLockoutTime(user.id);
      throw new Error(
        `Account locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s) or contact support.`
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      // Record failed login attempt
      const lockoutResult = await recordFailedLoginAttempt(user.id);
      
      if (lockoutResult.isLocked) {
        const remainingMinutes = Math.ceil(
          (lockoutResult.lockoutUntil!.getTime() - new Date().getTime()) / (1000 * 60)
        );
        throw new Error(
          `Too many failed login attempts. Account locked for ${remainingMinutes} minute(s). Please try again later or contact support.`
        );
      }
      
      throw new Error('Invalid email or password');
    }

    // Reset failed login attempts on successful authentication
    await resetFailedLoginAttempts(user.id);

    // Check if password is expired
    const {
      isPasswordExpired,
      getPasswordExpirationStatus,
    } = await import('@/lib/password-expiration');
    
    const passwordExpired = await isPasswordExpired(user.id);
    if (passwordExpired) {
      const expirationStatus = await getPasswordExpirationStatus(user.id);
      throw new Error(
        `PASSWORD_EXPIRED: Your password has expired. Please change your password to continue. Days expired: ${expirationStatus.daysUntilExpiration ? Math.abs(expirationStatus.daysUntilExpiration) : 'unknown'}`
      );
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        cooperativeId: user.cooperativeId,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
    };
  }

  // Refresh Token
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const decoded = this.verifyToken(refreshToken);

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    // Get user to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new tokens
    return this.generateTokens(user.id, user.email, user.role);
  }

  // Password Reset Request
  async requestPasswordReset(data: PasswordResetRequestData): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      // Don't reveal if user exists or not for security
      return;
    }

    // Generate secure reset token using crypto
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetToken,
        resetTokenExpiry: resetTokenExpiry
      }
    });

    // Send password reset email
    const resetLink = getPasswordResetLink(user.email, resetToken);
    
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request - Nogalss Cooperative</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
        <div style="background-color: #ffffff; margin: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background-color: #16a34a; padding: 30px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Password Reset Request</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Nogalss National Apex Cooperative Society</p>
          </div>
          <div style="padding: 30px 20px;">
            <p style="font-size: 16px; margin: 0 0 20px 0;">Dear ${user.firstName} ${user.lastName},</p>
            <p style="font-size: 16px; margin: 0 0 20px 0; color: #555555;">
              We received a request to reset the password for your Nogalss National Apex Cooperative Society account. 
              If you made this request, please click the button below to reset your password.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; padding: 15px 30px; background-color: #16a34a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Reset My Password
              </a>
            </div>
            <div style="background-color: #fef3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="font-size: 14px; margin: 0; color: #92400e;">
                <strong>Security Notice:</strong> This password reset link will expire in 1 hour. 
                If you didn't request this password reset, please ignore this email.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `PASSWORD RESET REQUEST - NOGALSS NATIONAL APEX COOPERATIVE SOCIETY

Dear ${user.firstName} ${user.lastName},

We received a request to reset the password for your account.

To reset your password, please visit: ${resetLink}

This link will expire in 1 hour. If you didn't request this, please ignore this email.`;

    try {
      await sendMail({
        to: user.email,
        subject: 'Password Reset Request - Nogalss National Apex Cooperative Society',
        html: emailHtml,
        text: emailText
      });

      // Log the password reset request
      await prisma.log.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          action: `Password reset requested for user ${user.email}`
        }
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't throw - we don't want to reveal if email sending failed
    }
  }

  // Password Reset
  async resetPassword(data: PasswordResetData): Promise<void> {
    // Validate token format
    if (!data.token || data.token.length !== 64) {
      throw new Error('Invalid reset token format');
    }

    // Find user with valid reset token from database
    const user = await prisma.user.findFirst({
      where: {
        resetToken: data.token,
        resetTokenExpiry: {
          gt: new Date() // Token hasn't expired
        },
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    // Update password expiration
    const { updatePasswordExpiration } = await import('@/lib/password-expiration');
    await updatePasswordExpiration(user.id);

    // Log the password reset
    await prisma.log.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: `Password reset completed for user ${user.email || user.firstName} ${user.lastName}`
      }
    });
  }

  // Change Password
  async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Update password expiration
    const { updatePasswordExpiration } = await import('@/lib/password-expiration');
    await updatePasswordExpiration(userId);
  }

  // Update Profile
  async updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfile> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        address: data.address,
      },
    });

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      cooperativeId: user.cooperativeId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // Get User Profile
  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      cooperativeId: user.cooperativeId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // Verify Access Token
  async verifyAccessToken(token: string): Promise<{ userId: string; email: string; role: UserRole }> {
    const decoded = this.verifyToken(token);

    if (decoded.type !== 'access') {
      throw new Error('Invalid access token');
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  }

  // Logout (invalidate refresh token)
  async logout(refreshToken: string): Promise<void> {
    // In a more sophisticated implementation, you might want to store
    // refresh tokens in a blacklist or revoke them in the database
    // For now, we'll just verify the token is valid
    this.verifyToken(refreshToken);
  }
}

// Export singleton instance
export const identityService = new IdentityService();
