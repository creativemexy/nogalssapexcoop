import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { validatePassword, getPasswordPolicyMessage } from '@/lib/utils';
import { updatePasswordExpiration } from '@/lib/password-expiration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ message: 'Token and password are required' }, { status: 400 });
    }

    // Enforce strong password policy
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ 
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
        policy: getPasswordPolicyMessage()
      }, { status: 400 });
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token hasn't expired
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user's password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    // Update password expiration
    await updatePasswordExpiration(user.id);

    // Log the password reset
    await prisma.log.create({
      data: {
        userId: user.id,
        userEmail: user.email || 'No email',
        action: `Password reset completed for user ${user.email || user.firstName} ${user.lastName}`
      }
    });

    return NextResponse.json({ 
      message: 'Password has been successfully reset' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ 
      message: 'An error occurred. Please try again later.' 
    }, { status: 500 });
  }
}
