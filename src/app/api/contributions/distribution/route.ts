import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Try getToken first (more reliable in API routes)
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // Fallback to getServerSession
    let session: any = null;
    let userRole: string | null = null;
    let userId: string | null = null;
    
    if (token && token.id && token.role) {
      session = {
        user: {
          id: token.id as string,
          email: token.email as string,
          role: token.role as string,
        },
      };
      userRole = token.role as string;
      userId = token.id as string;
    } else {
      const serverSession = await getServerSession(authOptions);
      if (serverSession?.user) {
        session = serverSession;
        userRole = (serverSession.user as any).role;
        userId = (serverSession.user as any).id;
      }
    }
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // all, month, year
    const groupBy = searchParams.get('groupBy') || 'cooperative'; // cooperative, member, month
    const parentOrganizationId = searchParams.get('parentOrganizationId') || null;
    const cooperativeId = searchParams.get('cooperativeId') || null;

    // Build date filter
    let dateFilter: any = {};
    const now = new Date();
    if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter.createdAt = { gte: startOfMonth };
    } else if (period === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      dateFilter.createdAt = { gte: startOfYear };
    }

    // Build where clause based on user role
    let whereClause: any = { ...dateFilter };

    if (userRole === 'PARENT_ORGANIZATION') {
      // Get parent organization for this user
      const parentOrg = await prisma.parentOrganization.findFirst({
        where: { userId: userId },
      });
      if (parentOrg) {
        whereClause.user = {
          cooperative: {
            parentOrganizationId: parentOrg.id,
          },
        };
      } else {
        return NextResponse.json({ error: 'Parent organization not found' }, { status: 404 });
      }
    } else if (userRole === 'COOPERATIVE' || userRole === 'LEADER') {
      // Get cooperative for this user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { cooperativeId: true },
      });
      if (user?.cooperativeId) {
        whereClause.cooperativeId = user.cooperativeId;
      } else {
        return NextResponse.json({ error: 'Cooperative not found' }, { status: 404 });
      }
    } else if (userRole === 'MEMBER') {
      whereClause.userId = userId;
    } else if (userRole === 'APEX' || userRole === 'SUPER_ADMIN') {
      // APEX and SUPER_ADMIN can see all, but can filter by parentOrganizationId
      if (parentOrganizationId) {
        whereClause.user = {
          cooperative: {
            parentOrganizationId: parentOrganizationId,
          },
        };
      }
      // If cooperativeId is specified, filter by that
      if (cooperativeId) {
        whereClause.cooperativeId = cooperativeId;
      }
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch contributions based on groupBy
    let distribution: any[] = [];
    let totalAmount = 0;

    if (groupBy === 'cooperative') {
      const contributions = await prisma.contribution.groupBy({
        by: ['cooperativeId'],
        where: whereClause,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      // Get cooperative details
      const cooperativeIds = contributions.map(c => c.cooperativeId).filter(Boolean) as string[];
      const cooperatives = await prisma.cooperative.findMany({
        where: { id: { in: cooperativeIds } },
        select: { id: true, name: true },
      });

      const cooperativeMap = new Map(cooperatives.map(c => [c.id, c.name]));

      distribution = contributions.map(contrib => {
        const amount = Number(contrib._sum.amount || 0) / 100; // Convert from kobo to naira
        totalAmount += amount;
        return {
          name: cooperativeMap.get(contrib.cooperativeId || '') || 'Unknown Cooperative',
          value: amount,
          count: contrib._count.id,
          id: contrib.cooperativeId,
        };
      });
    } else if (groupBy === 'member') {
      const contributions = await prisma.contribution.groupBy({
        by: ['userId'],
        where: whereClause,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      // Get user details (top contributors)
      const userIds = contributions.map(c => c.userId).filter(Boolean) as string[];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true },
      });

      const userMap = new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`]));

      distribution = contributions
        .map(contrib => {
          const amount = Number(contrib._sum.amount || 0) / 100;
          totalAmount += amount;
          return {
            name: userMap.get(contrib.userId || '') || 'Unknown User',
            value: amount,
            count: contrib._count.id,
            id: contrib.userId,
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Top 10 contributors
    } else if (groupBy === 'month') {
      const contributions = await prisma.contribution.findMany({
        where: whereClause,
        select: {
          amount: true,
          createdAt: true,
        },
      });

      // Group by month
      const monthMap = new Map<string, number>();
      contributions.forEach(contrib => {
        const date = new Date(contrib.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const amount = Number(contrib.amount) / 100;
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, 0);
        }
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + amount);
        totalAmount += amount;
      });

      distribution = Array.from(monthMap.entries())
        .map(([key, value]) => {
          const [year, month] = key.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return {
            name: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
            value: value,
            count: 0,
            id: key,
          };
        })
        .sort((a, b) => a.id.localeCompare(b.id));
    }

    return NextResponse.json({
      distribution,
      totalAmount,
      period,
      groupBy,
      count: distribution.length,
    });
  } catch (error: any) {
    console.error('Error fetching contribution distribution:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}


