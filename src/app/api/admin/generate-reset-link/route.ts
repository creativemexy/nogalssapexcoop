import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, userEmail } = body;

    if (!userId || !userEmail) {
      return NextResponse.json({ 
        message: 'User ID and email are required' 
      }, { status: 400 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        message: 'User not found' 
      }, { status: 404 });
    }

    // Generate new reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user with reset token
    await prisma.user.update({
      where: { id: userId },
      data: {
        resetToken: resetToken,
        resetTokenExpiry: resetExpiry
      }
    });

    // Generate reset link
    const resetLink = `https://nogalssapexcoop.org/auth/reset-password?email=${encodeURIComponent(userEmail)}&token=${resetToken}`;

    // Log the admin action
    await prisma.log.create({
      data: {
        userId: userId,
        userEmail: userEmail,
        action: `Admin-generated password reset link for ${user.firstName} ${user.lastName} (${userEmail})`
      }
    });

    return NextResponse.json({
      success: true,
      resetLink,
      token: resetToken,
      expiresAt: resetExpiry.toISOString(),
      user: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error generating reset link:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
