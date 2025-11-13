import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyTOTPToken } from '@/lib/utils';
import {
  isAccountLocked,
  recordFailedLoginAttempt,
  resetFailedLoginAttempts,
  getRemainingLockoutTime,
} from '@/lib/account-lockout';
import {
  isPasswordExpired,
  getPasswordExpirationStatus,
} from '@/lib/password-expiration';

/**
 * Mobile login endpoint that uses NextAuth JWT tokens
 * This endpoint authenticates users and returns a NextAuth JWT token
 * that can be used for API authentication
 */

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, totp } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user (same logic as NextAuth authorize function)
    const isEmail = email.includes('@');
    const isPhone = /^(\+?234|0)?[789][01]\d{8}$/.test(email);
    const isNIN = /^\d{11}$/.test(email);
    let user;

    if (isEmail) {
      user = await prisma.user.findUnique({
        where: { email: email }
      });
    } else if (isPhone) {
      let normalizedPhone = email;
      if (normalizedPhone.startsWith('+234')) {
        normalizedPhone = '0' + normalizedPhone.substring(4);
      } else if (normalizedPhone.startsWith('234')) {
        normalizedPhone = '0' + normalizedPhone.substring(3);
      }
      user = await prisma.user.findFirst({
        where: { phoneNumber: normalizedPhone }
      });
    } else if (isNIN) {
      user = await prisma.user.findFirst({
        where: { nin: email }
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid login format' },
        { status: 400 }
      );
    }

    if (!user || !user.password) {
      // Don't reveal if user exists for security
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if account is locked
    const accountLocked = await isAccountLocked(user.id);
    if (accountLocked) {
      const remainingMinutes = await getRemainingLockoutTime(user.id);
      return NextResponse.json(
        {
          error: `Account locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s) or contact support.`,
          code: 'ACCOUNT_LOCKED',
          remainingMinutes,
        },
        { status: 423 } // 423 Locked
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Record failed login attempt
      const lockoutResult = await recordFailedLoginAttempt(user.id);
      
      if (lockoutResult.isLocked) {
        const remainingMinutes = Math.ceil(
          (lockoutResult.lockoutUntil!.getTime() - new Date().getTime()) / (1000 * 60)
        );
        return NextResponse.json(
          {
            error: `Too many failed login attempts. Account locked for ${remainingMinutes} minute(s). Please try again later or contact support.`,
            code: 'ACCOUNT_LOCKED',
            remainingMinutes,
            remainingAttempts: 0,
          },
          { status: 423 } // 423 Locked
        );
      }

      return NextResponse.json(
        {
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
          remainingAttempts: lockoutResult.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Check 2FA
    if (user.twoFactorEnabled) {
      if (!totp) {
        return NextResponse.json(
          { error: '2FA_REQUIRED', requires2FA: true },
          { status: 401 }
        );
      }
      if (!user.twoFactorSecret) {
        return NextResponse.json(
          { error: '2FA_NOT_SETUP' },
          { status: 400 }
        );
      }
      const isTotpValid = verifyTOTPToken(user.twoFactorSecret, totp);
      if (!isTotpValid) {
        return NextResponse.json(
          { error: '2FA_INVALID' },
          { status: 401 }
        );
      }
    } else {
      // Check global 2FA
      const global2FASetting = await prisma.setting.findUnique({
        where: { key: 'global_2fa_enabled' }
      });
      if (global2FASetting?.value === 'true') {
        if (!user.twoFactorEnabled) {
          return NextResponse.json(
            { error: '2FA_REQUIRED_GLOBAL' },
            { status: 401 }
          );
        }
        if (!totp) {
          return NextResponse.json(
            { error: '2FA_REQUIRED', requires2FA: true },
            { status: 401 }
          );
        }
        if (!user.twoFactorSecret) {
          return NextResponse.json(
            { error: '2FA_NOT_SETUP' },
            { status: 400 }
          );
        }
        const isTotpValid = verifyTOTPToken(user.twoFactorSecret, totp);
        if (!isTotpValid) {
          return NextResponse.json(
            { error: '2FA_INVALID' },
            { status: 401 }
          );
        }
      }
    }

    // Reset failed login attempts on successful authentication
    await resetFailedLoginAttempts(user.id);

    // Check if password is expired
    const passwordExpired = await isPasswordExpired(user.id);
    if (passwordExpired) {
      const expirationStatus = await getPasswordExpirationStatus(user.id);
      return NextResponse.json(
        {
          error: 'Your password has expired. Please change your password to continue.',
          code: 'PASSWORD_EXPIRED',
          daysExpired: expirationStatus.daysUntilExpiration
            ? Math.abs(expirationStatus.daysUntilExpiration)
            : null,
        },
        { status: 403 } // 403 Forbidden
      );
    }

    // Create NextAuth JWT token
    const token = await encode({
      token: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        cooperativeId: user.cooperativeId,
        businessId: user.businessId,
      },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    const origin = request.headers.get('origin') || '*';
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        cooperativeId: user.cooperativeId,
        businessId: user.businessId,
      },
      token: token, // NextAuth JWT token
    }, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    });

  } catch (error: any) {
    console.error('Mobile login error:', error);
    const origin = request.headers.get('origin') || '*';
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }
}
