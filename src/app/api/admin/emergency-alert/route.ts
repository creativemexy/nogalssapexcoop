import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession, logSecurityEvent } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { emitDashboardUpdate } from '@/lib/notifications';

const createAlertSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
  severity: z.enum(['CRITICAL', 'WARNING']),
});

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

    const { user } = authResult;
    const body = await request.json();
    const { title, message, severity } = createAlertSchema.parse(body);

    // Deactivate all previous alerts
    await prisma.emergencyAlert.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new alert
    const alert = await prisma.emergencyAlert.create({
      data: {
        title,
        message,
        severity,
        createdBy: user.id,
      },
    });

    // Log security event for audit
    await logSecurityEvent(user.id, 'EMERGENCY_ALERT_CREATED', {
      alertId: alert.id,
      title,
      severity,
      timestamp: new Date().toISOString(),
    });

    // Send email to all users
    try {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { email: true, firstName: true, lastName: true },
      });

      const { sendMail } = await import('@/lib/email');
      const { getEmergencyAlertEmailHtml } = await import('@/lib/notifications');

      const emailPromises = users.map(user => 
        sendMail({
          to: user.email,
          subject: `🚨 Emergency Alert: ${title}`,
          html: getEmergencyAlertEmailHtml({
            title,
            message,
            severity,
            createdAt: alert.createdAt,
          }),
        }).catch(err => console.error(`Failed to send alert email to ${user.email}:`, err))
      );

      await Promise.allSettled(emailPromises);
    } catch (err) {
      console.error('Failed to send alert emails:', err);
      // Don't fail the request if email sending fails
    }

    // Emit real-time update for dashboard
    emitDashboardUpdate();

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error('Error creating emergency alert:', error);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const alerts = await prisma.emergencyAlert.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ alerts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    // Return empty alerts array instead of error to prevent 401 issues
    return NextResponse.json({ alerts: [] }, { status: 200 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    await prisma.emergencyAlert.update({
      where: { id },
      data: { isActive: false },
    });

    // Log security event for audit
    await logSecurityEvent(user.id, 'EMERGENCY_ALERT_DEACTIVATED', {
      alertId: id,
      timestamp: new Date().toISOString(),
    });

    // Emit real-time update for dashboard
    emitDashboardUpdate();

    return NextResponse.json({ message: 'Alert deactivated' }, { status: 200 });
  } catch (error) {
    console.error('Error deactivating alert:', error);
    return NextResponse.json({ error: 'Failed to deactivate alert' }, { status: 500 });
  }
}

