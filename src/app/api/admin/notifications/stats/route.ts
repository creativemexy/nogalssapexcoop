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

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '4');
    const offset = (page - 1) * limit;

    // Get notification statistics
    const [
      totalEmails,
      totalSMS,
      sentEmails,
      sentSMS,
      failedEmails,
      failedSMS,
      pendingEmails,
      pendingSMS,
      totalSMSCost,
      recentNotifications,
      totalNotifications
    ] = await Promise.all([
      // Total counts
      prisma.notificationLog.count({ where: { type: 'EMAIL' } }),
      prisma.notificationLog.count({ where: { type: 'SMS' } }),
      
      // Sent counts
      prisma.notificationLog.count({ where: { type: 'EMAIL', status: 'SENT' } }),
      prisma.notificationLog.count({ where: { type: 'SMS', status: 'SENT' } }),
      
      // Failed counts
      prisma.notificationLog.count({ where: { type: 'EMAIL', status: 'FAILED' } }),
      prisma.notificationLog.count({ where: { type: 'SMS', status: 'FAILED' } }),
      
      // Pending counts
      prisma.notificationLog.count({ where: { type: 'EMAIL', status: 'PENDING' } }),
      prisma.notificationLog.count({ where: { type: 'SMS', status: 'PENDING' } }),
      
      // Total SMS cost
      prisma.notificationLog.aggregate({
        where: { type: 'SMS', status: 'SENT' },
        _sum: { cost: true }
      }),
      
      // Recent notifications with pagination
      prisma.notificationLog.findMany({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          type: true,
          recipient: true,
          subject: true,
          status: true,
          cost: true,
          createdAt: true,
          sentAt: true,
        }
      }),
      
      // Total count for pagination
      prisma.notificationLog.count()
    ]);

    // Calculate success rates
    const emailSuccessRate = totalEmails > 0 ? (sentEmails / totalEmails) * 100 : 0;
    const smsSuccessRate = totalSMS > 0 ? (sentSMS / totalSMS) * 100 : 0;

    // Get daily stats for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await prisma.notificationLog.groupBy({
      by: ['type', 'status'],
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      _count: { id: true },
      _sum: { cost: true }
    });

    // Format daily stats
    const formattedDailyStats = dailyStats.reduce((acc, stat) => {
      const key = `${stat.type}_${stat.status}`;
      acc[key] = {
        count: stat._count.id,
        cost: stat._sum.cost || 0
      };
      return acc;
    }, {} as Record<string, { count: number; cost: number }>);

    const stats = {
      totals: {
        emails: totalEmails,
        sms: totalSMS,
        total: totalEmails + totalSMS
      },
      sent: {
        emails: sentEmails,
        sms: sentSMS,
        total: sentEmails + sentSMS
      },
      failed: {
        emails: failedEmails,
        sms: failedSMS,
        total: failedEmails + failedSMS
      },
      pending: {
        emails: pendingEmails,
        sms: pendingSMS,
        total: pendingEmails + pendingSMS
      },
      successRates: {
        emails: Math.round(emailSuccessRate * 100) / 100,
        sms: Math.round(smsSuccessRate * 100) / 100
      },
      costs: {
        totalSMSCost: totalSMSCost._sum.cost || 0,
        averageSMSCost: totalSMS > 0 ? (totalSMSCost._sum.cost || 0) / totalSMS : 0
      },
      recent: recentNotifications,
      dailyStats: formattedDailyStats,
      pagination: {
        page,
        limit,
        total: totalNotifications,
        totalPages: Math.ceil(totalNotifications / limit),
        hasNext: page < Math.ceil(totalNotifications / limit),
        hasPrev: page > 1
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return NextResponse.json({ error: 'Failed to fetch notification statistics' }, { status: 500 });
  }
}
