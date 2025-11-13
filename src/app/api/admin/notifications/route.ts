import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET - Fetch notifications for super admin users
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.inAppNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.inAppNotification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Mark notification as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { notificationId, markAllAsRead } = await request.json();

    if (markAllAsRead) {
      // Mark all notifications as read
      await prisma.inAppNotification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    // Mark specific notification as read
    const notification = await prisma.inAppNotification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

