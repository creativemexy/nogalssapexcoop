import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied. Super admin role required.' }, { status: 403 });
    }

    // Fetch user statistics
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      usersByRole
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Active users
      prisma.user.count({
        where: { isActive: true }
      }),
      
      // Verified users
      prisma.user.count({
        where: { isVerified: true }
      }),
      
      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        }
      })
    ]);

    // Format users by role
    const roleCounts = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      totalUsers,
      activeUsers,
      verifiedUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: Object.entries(roleCounts).map(([role, count]) => ({
        role,
        count
      }))
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

