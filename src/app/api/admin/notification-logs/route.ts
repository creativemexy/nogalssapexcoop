import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (search) {
      where.OR = [
        { recipient: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get notification logs with pagination
    const [logs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          recipient: true,
          subject: true,
          message: true,
          status: true,
          provider: true,
          providerId: true,
          errorMessage: true,
          cost: true,
          sentAt: true,
          createdAt: true
        }
      }),
      prisma.notificationLog.count({ where })
    ]);

    // Get statistics
    const stats = await prisma.notificationLog.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          total,
          sent: statusStats.SENT || 0,
          failed: statusStats.FAILED || 0,
          pending: statusStats.PENDING || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching notification logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification logs' },
      { status: 500 }
    );
  }
}
