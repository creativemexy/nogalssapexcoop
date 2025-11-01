import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Get the notification log
    const notification = await prisma.notificationLog.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.status === 'SENT') {
      return NextResponse.json(
        { error: 'Notification has already been sent successfully' },
        { status: 400 }
      );
    }

    // Update status to PENDING
    await prisma.notificationLog.update({
      where: { id: notificationId },
      data: { 
        status: 'PENDING',
        errorMessage: null
      }
    });

    let result;
    
    try {
      if (notification.type === 'EMAIL') {
        result = await NotificationService.sendEmail({
          to: notification.recipient,
          subject: notification.subject || 'Resent Notification',
          html: notification.message
        });
      } else if (notification.type === 'SMS') {
        result = await NotificationService.sendSMS({
          to: notification.recipient,
          message: notification.message
        });
      } else {
        throw new Error('Unsupported notification type');
      }

      // Update with success
      await prisma.notificationLog.update({
        where: { id: notificationId },
        data: {
          status: 'SENT',
          providerId: result.messageId,
          sentAt: new Date(),
          cost: result.cost || 0
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Notification resent successfully',
        data: {
          id: notificationId,
          status: 'SENT',
          providerId: result.messageId,
          provider: result.provider
        }
      });

    } catch (error: any) {
      // Update with error
      await prisma.notificationLog.update({
        where: { id: notificationId },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      });

      return NextResponse.json({
        success: false,
        message: 'Failed to resend notification',
        error: error.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error resending notification:', error);
    return NextResponse.json(
      { error: 'Failed to resend notification' },
      { status: 500 }
    );
  }
}

// Bulk resend endpoint
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationIds } = await request.json();

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Notification IDs array is required' },
        { status: 400 }
      );
    }

    const results = [];
    
    for (const notificationId of notificationIds) {
      try {
        // Get the notification log
        const notification = await prisma.notificationLog.findUnique({
          where: { id: notificationId }
        });

        if (!notification || notification.status === 'SENT') {
          results.push({
            id: notificationId,
            success: false,
            message: notification ? 'Already sent' : 'Not found'
          });
          continue;
        }

        // Update status to PENDING
        await prisma.notificationLog.update({
          where: { id: notificationId },
          data: { 
            status: 'PENDING',
            errorMessage: null
          }
        });

        let result;
        
        if (notification.type === 'EMAIL') {
          result = await NotificationService.sendEmail({
            to: notification.recipient,
            subject: notification.subject || 'Resent Notification',
            html: notification.message
          });
        } else if (notification.type === 'SMS') {
          result = await NotificationService.sendSMS({
            to: notification.recipient,
            message: notification.message
          });
        } else {
          throw new Error('Unsupported notification type');
        }

        // Update with success
        await prisma.notificationLog.update({
          where: { id: notificationId },
          data: {
            status: 'SENT',
            providerId: result.messageId,
            sentAt: new Date(),
            cost: result.cost || 0
          }
        });

        results.push({
          id: notificationId,
          success: true,
          message: 'Resent successfully',
          providerId: result.messageId
        });

      } catch (error: any) {
        // Update with error
        await prisma.notificationLog.update({
          where: { id: notificationId },
          data: {
            status: 'FAILED',
            errorMessage: error.message
          }
        });

        results.push({
          id: notificationId,
          success: false,
          message: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Bulk resend completed: ${successCount} successful, ${failureCount} failed`,
      data: {
        results,
        summary: {
          total: notificationIds.length,
          successful: successCount,
          failed: failureCount
        }
      }
    });

  } catch (error) {
    console.error('Error in bulk resend:', error);
    return NextResponse.json(
      { error: 'Failed to resend notifications' },
      { status: 500 }
    );
  }
}
