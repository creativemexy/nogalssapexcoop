import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { searchSchema } from '@/lib/validation';
import { validateRequest } from '@/middleware/validation';
import { emitDashboardUpdate, emitUserActivity } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  // Get session and validate with proper type safety
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    // Parse query params
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const roleFilter = searchParams.get('role') || 'all';
    const statusFilter = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phoneNumber: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    if (roleFilter !== 'all') {
      whereClause.role = roleFilter;
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') whereClause.isActive = true;
      if (statusFilter === 'inactive') whereClause.isActive = false;
      if (statusFilter === 'verified') whereClause.isVerified = true;
      if (statusFilter === 'unverified') whereClause.isVerified = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          cooperative: {
            select: { name: true }
          },
          business: {
            select: { name: true }
          }
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      users,
      total,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

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

    // TODO: Add your user creation logic here
    // After successful creation:
    emitDashboardUpdate();
    
    // Emit user activity event
    emitUserActivity(
      { id: (session.user as any).id!, email: session.user.email!, role: (session.user as any).role! },
      'USER_CREATED',
      { timestamp: new Date().toISOString() }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
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

    // TODO: Add your user update logic here
    // After successful update:
    emitDashboardUpdate();
    
    // Emit user activity event
    emitUserActivity(
      { id: (session.user as any).id!, email: session.user.email!, role: (session.user as any).role! },
      'USER_UPDATED',
      { timestamp: new Date().toISOString() }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    // TODO: Add your user deletion logic here
    // After successful deletion:
    emitDashboardUpdate();
    
    // Emit user activity event
    emitUserActivity(
      { id: (session.user as any).id!, email: session.user.email!, role: (session.user as any).role! },
      'USER_DELETED',
      { timestamp: new Date().toISOString() }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

