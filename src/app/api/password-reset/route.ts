import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ message: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters long' }, { status: 400 });
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
