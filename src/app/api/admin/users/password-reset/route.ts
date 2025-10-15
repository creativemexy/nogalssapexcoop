import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/email';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    const body = await request.json();
    const { userId, sendEmail = true } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Cannot reset password for inactive user' }, { status: 400 });
    }

    // Generate a new temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Update user's password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword
      }
    });

    // Log the password reset
    await prisma.log.create({
      data: {
        userId: (session.user as any).id,
        userEmail: (session.user as any).email || 'unknown',
        action: 'Password reset by super admin'
      }
    });

    // Send email notification if requested
    if (sendEmail) {
      try {
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0D5E42;">Password Reset Notification</h2>
            <p>Dear ${user.firstName} ${user.lastName},</p>
            <p>Your password has been reset by a system administrator. Please use the following temporary password to log in:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>Temporary Password:</strong> ${tempPassword}
            </div>
            <p><strong>Important Security Notes:</strong></p>
            <ul>
              <li>Please change this password immediately after logging in</li>
              <li>Do not share this password with anyone</li>
              <li>If you did not request this password reset, please contact support immediately</li>
            </ul>
            <p>You can log in at: <a href="${process.env.NEXTAUTH_URL}/auth/signin">${process.env.NEXTAUTH_URL}/auth/signin</a></p>
            <p>If you have any questions, please contact our support team.</p>
            <br>
            <p>Best regards,<br>Nogalss Team</p>
          </div>
        `;

        await sendMail({
          to: user.email,
          subject: 'Password Reset - Nogalss Platform',
          html: emailContent
        });

        // Log email sent
        await prisma.log.create({
          data: {
            userId: (session.user as any).id,
            userEmail: (session.user as any).email || 'unknown',
            action: 'Password reset email sent'
          }
        });

      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
        // Don't fail the request if email fails, just log it
        await prisma.log.create({
          data: {
            userId: (session.user as any).id,
            userEmail: (session.user as any).email || 'unknown',
            action: 'Failed to send password reset email'
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${user.firstName} ${user.lastName}`,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      },
      temporaryPassword: sendEmail ? null : tempPassword, // Only return password if email wasn't sent
      emailSent: sendEmail
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    let whereClause: any = {
      isActive: true
    };

    // Add search filter
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get users for password reset
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          cooperative: {
            select: {
              name: true
            }
          },
          business: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where: whereClause })
    ]);

    const pages = Math.max(1, Math.ceil(totalCount / limit));

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        organization: user.cooperative?.name || user.business?.name || 'N/A'
      })),
      pagination: {
        page,
        pages,
        count: totalCount,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching users for password reset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
