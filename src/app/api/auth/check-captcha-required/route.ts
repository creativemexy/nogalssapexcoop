import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isCaptchaRequired } from '@/lib/captcha';
import { getFailedLoginAttempts } from '@/lib/account-lockout';

/**
 * Check if CAPTCHA is required for a login attempt
 * This endpoint is called before showing the login form
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, nin } = body;

    // Find user by identifier
    let user = null;
    if (email) {
      user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, failedLoginAttempts: true },
      });
    } else if (phone) {
      // Normalize phone number
      let normalizedPhone = phone;
      if (normalizedPhone.startsWith('+234')) {
        normalizedPhone = '0' + normalizedPhone.substring(4);
      } else if (normalizedPhone.startsWith('234')) {
        normalizedPhone = '0' + normalizedPhone.substring(3);
      }
      user = await prisma.user.findFirst({
        where: { phoneNumber: normalizedPhone },
        select: { id: true, failedLoginAttempts: true },
      });
    } else if (nin) {
      user = await prisma.user.findFirst({
        where: { nin },
        select: { id: true, failedLoginAttempts: true },
      });
    }

    if (!user) {
      // Don't reveal if user exists, but don't require CAPTCHA for non-existent users
      return NextResponse.json({ captchaRequired: false, failedAttempts: 0 });
    }

    const failedAttempts = user.failedLoginAttempts || 0;
    const captchaRequired = await isCaptchaRequired(user.id, failedAttempts);

    return NextResponse.json({
      captchaRequired,
      failedAttempts,
    });
  } catch (error) {
    console.error('Error checking CAPTCHA requirement:', error);
    // On error, don't require CAPTCHA to avoid blocking legitimate users
    return NextResponse.json({ captchaRequired: false, failedAttempts: 0 });
  }
}

