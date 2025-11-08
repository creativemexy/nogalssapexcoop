import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyTOTPToken } from '@/lib/utils';

/**
 * Mobile login endpoint that uses NextAuth JWT tokens
 * This endpoint authenticates users and returns a NextAuth JWT token
 * that can be used for API authentication
 */

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
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
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error: any) {
    console.error('Mobile login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}
