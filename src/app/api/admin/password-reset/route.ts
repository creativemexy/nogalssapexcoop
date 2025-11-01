import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// GET - List recent password reset requests
export async function GET(request: NextRequest) {
  try {
    // Get recent password reset requests from logs
    const recentResets = await prisma.log.findMany({
      where: {
        action: {
          contains: 'Password reset'
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 20
    });

    return NextResponse.json({
      success: true,
      data: recentResets
    });

  } catch (error) {
    console.error('Error fetching password reset requests:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch password reset requests' },
      { status: 500 }
    );
  }
}

// POST - Manually reset a user's password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Email and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Log the manual password reset
    await prisma.log.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: `Password manually reset by admin for user ${user.email}`
      }
    });

    return NextResponse.json({
      success: true,
      message: `Password successfully reset for ${user.email}`,
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
