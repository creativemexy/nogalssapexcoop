import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logId, logIds } = body;

    // Handle single notification resend
    if (logId) {
      const notification = await prisma.notificationLog.findUnique({
        where: { id: logId }
      });

      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      try {
        let result;
        if (notification.type === 'EMAIL') {
          result = await NotificationService.sendEmail({
            to: notification.recipient,
            subject: notification.subject || 'Resent Notification',
            html: notification.message,
          });
        } else {
          result = await NotificationService.sendSMS({
            to: notification.recipient,
            message: notification.message,
          });
        }

        // Update the notification log
        await prisma.notificationLog.update({
          where: { id: logId },
          data: {
            status: 'SENT',
            providerId: result.messageId || result.id,
            sentAt: new Date(),
            errorMessage: null,
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Notification resent successfully',
          result
        });

      } catch (error: any) {
        // Update the notification log with error
        await prisma.notificationLog.update({
          where: { id: logId },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          }
        });

        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }
    }

    // Handle bulk resend
    if (logIds && Array.isArray(logIds)) {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const id of logIds) {
        try {
          const notification = await prisma.notificationLog.findUnique({
            where: { id }
          });

          if (!notification) {
            errorCount++;
            errors.push(`Notification ${id} not found`);
            continue;
          }

          let result;
          if (notification.type === 'EMAIL') {
            result = await NotificationService.sendEmail({
              to: notification.recipient,
              subject: notification.subject || 'Resent Notification',
              html: notification.message,
            });
          } else {
            result = await NotificationService.sendSMS({
              to: notification.recipient,
              message: notification.message,
            });
          }

          // Update the notification log
          await prisma.notificationLog.update({
            where: { id },
            data: {
              status: 'SENT',
              providerId: result.messageId || result.id,
              sentAt: new Date(),
              errorMessage: null,
            }
          });

          successCount++;

        } catch (error: any) {
          errorCount++;
          errors.push(`Notification ${id}: ${error.message}`);

          // Update the notification log with error
          await prisma.notificationLog.update({
            where: { id },
            data: {
              status: 'FAILED',
              errorMessage: error.message,
            }
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Bulk resend completed. ${successCount} successful, ${errorCount} failed.`,
        resentCount: successCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined
      });
    }

    return NextResponse.json(
      { error: 'Either logId or logIds is required' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error resending notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

