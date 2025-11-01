import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const filter = searchParams.get('filter') || 'all';

    // Build where clause based on filter
    let whereClause: any = {};
    
    if (filter === 'email_failures') {
      whereClause.action = {
        contains: 'email failed'
      };
    } else if (filter === 'password_resets') {
      whereClause.action = {
        contains: 'Password reset'
      };
    }

    // Fetch logs
    const logs = await prisma.log.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Fetch user information for each log
    const logsWithUsers = await Promise.all(
      logs.map(async (log) => {
        const user = await prisma.user.findUnique({
          where: { id: log.userId },
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        });
        
        return {
          ...log,
          user
        };
      })
    );

    // Get total count for pagination
    const totalCount = await prisma.log.count({
      where: whereClause
    });

    return NextResponse.json({
      logs: logsWithUsers,
      totalCount,
      hasMore: offset + limit < totalCount
    });

  } catch (error) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
