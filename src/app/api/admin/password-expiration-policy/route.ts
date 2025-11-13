import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPasswordExpirationPolicy } from '@/lib/password-expiration';

/**
 * Get password expiration policy (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const policy = await getPasswordExpirationPolicy();

    return NextResponse.json({
      success: true,
      policy,
    });
  } catch (error) {
    console.error('Error getting password expiration policy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Update password expiration policy (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, expirationDays, warningDays, forceChange } = body;

    const userId = (session.user as any).id;

    // Update or create settings
    await prisma.$transaction([
      prisma.systemSettings.upsert({
        where: {
          category_key: {
            category: 'security',
            key: 'PASSWORD_EXPIRATION_ENABLED',
          },
        },
        update: {
          value: enabled ? 'true' : 'false',
          updatedBy: userId,
        },
        create: {
          category: 'security',
          key: 'PASSWORD_EXPIRATION_ENABLED',
          value: enabled ? 'true' : 'false',
          updatedBy: userId,
          isActive: true,
        },
      }),
      prisma.systemSettings.upsert({
        where: {
          category_key: {
            category: 'security',
            key: 'PASSWORD_EXPIRATION_DAYS',
          },
        },
        update: {
          value: String(expirationDays || 90),
          updatedBy: userId,
        },
        create: {
          category: 'security',
          key: 'PASSWORD_EXPIRATION_DAYS',
          value: String(expirationDays || 90),
          updatedBy: userId,
          isActive: true,
        },
      }),
      prisma.systemSettings.upsert({
        where: {
          category_key: {
            category: 'security',
            key: 'PASSWORD_EXPIRATION_WARNING_DAYS',
          },
        },
        update: {
          value: String(warningDays || 7),
          updatedBy: userId,
        },
        create: {
          category: 'security',
          key: 'PASSWORD_EXPIRATION_WARNING_DAYS',
          value: String(warningDays || 7),
          updatedBy: userId,
          isActive: true,
        },
      }),
      prisma.systemSettings.upsert({
        where: {
          category_key: {
            category: 'security',
            key: 'PASSWORD_EXPIRATION_FORCE_CHANGE',
          },
        },
        update: {
          value: forceChange !== false ? 'true' : 'false',
          updatedBy: userId,
        },
        create: {
          category: 'security',
          key: 'PASSWORD_EXPIRATION_FORCE_CHANGE',
          value: forceChange !== false ? 'true' : 'false',
          updatedBy: userId,
          isActive: true,
        },
      }),
    ]);

    // Log the action
    await prisma.log.create({
      data: {
        userId,
        userEmail: (session.user as any).email || 'unknown',
        action: `Updated password expiration policy: enabled=${enabled}, expirationDays=${expirationDays}, warningDays=${warningDays}, forceChange=${forceChange}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password expiration policy updated successfully',
      policy: {
        enabled,
        expirationDays: expirationDays || 90,
        warningDays: warningDays || 7,
        forceChange: forceChange !== false,
      },
    });
  } catch (error) {
    console.error('Error updating password expiration policy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

