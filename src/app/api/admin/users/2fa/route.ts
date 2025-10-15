import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession } from '@/lib/security';
import { prisma } from '@/lib/prisma';

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
    const status = searchParams.get('status') || 'all'; // 'enabled', 'disabled', 'all'

    const skip = (page - 1) * limit;

    // Build where clause
    let whereClause: any = {
      isActive: true
    };

    // Filter by 2FA status
    if (status === 'enabled') {
      whereClause.twoFactorEnabled = true;
    } else if (status === 'disabled') {
      whereClause.twoFactorEnabled = false;
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get users with 2FA information
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          twoFactorEnabled: true,
          isActive: true,
          createdAt: true,
          cooperative: {
            select: {
              name: true,
              registrationNumber: true
            }
          },
          business: {
            select: {
              name: true,
              registrationNumber: true
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

    // Get 2FA statistics
    const [enabledCount, disabledCount] = await Promise.all([
      prisma.user.count({ where: { twoFactorEnabled: true, isActive: true } }),
      prisma.user.count({ where: { twoFactorEnabled: false, isActive: true } })
    ]);

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        isActive: user.isActive,
        createdAt: user.createdAt,
        organization: user.cooperative?.name || user.business?.name || 'N/A',
        organizationType: user.cooperative ? 'Cooperative' : user.business ? 'Business' : 'Individual'
      })),
      pagination: {
        page,
        pages,
        count: totalCount,
        limit
      },
      statistics: {
        total: totalCount,
        twoFactorEnabled: enabledCount,
        twoFactorDisabled: disabledCount,
        enabledPercentage: totalCount > 0 ? Math.round((enabledCount / totalCount) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching users with 2FA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    const { userId, action } = body; // action: 'enable' or 'disable'

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 });
    }

    if (!['enable', 'disable'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "enable" or "disable"' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, twoFactorEnabled: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newTwoFactorStatus = action === 'enable';
    
    // Update user's 2FA status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: newTwoFactorStatus,
        twoFactorSecret: newTwoFactorStatus ? null : null // Clear secret when disabling
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        twoFactorEnabled: true
      }
    });

    // Log the 2FA status change
    await prisma.log.create({
      data: {
        userId: (session.user as any).id,
        userEmail: (session.user as any).email || 'unknown',
        action: `2FA ${action}d for user by super admin`
      }
    });

    return NextResponse.json({
      success: true,
      message: `2FA ${action}d successfully for ${user.firstName} ${user.lastName}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        twoFactorEnabled: updatedUser.twoFactorEnabled
      }
    });

  } catch (error) {
    console.error('Error updating 2FA status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
