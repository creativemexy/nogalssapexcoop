import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
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

export async function GET(request: NextRequest) {
  try {
    // Authenticate user - allow APEX and SUPER_ADMIN to view alerts
    // Try getToken first (more reliable in API routes)
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // Fallback to getServerSession
    let session: any = null;
    let userRole: string | null = null;
    
    if (token && token.id && token.role) {
      session = {
        user: {
          id: token.id as string,
          email: token.email as string,
          role: token.role as string,
        },
      };
      userRole = token.role as string;
    } else {
      const serverSession = await getServerSession(authOptions);
      if (serverSession?.user) {
        session = serverSession;
        userRole = (serverSession.user as any).role;
      }
    }
    
    // Check if user is authenticated and has appropriate role
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Allow APEX and SUPER_ADMIN to view alerts
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'APEX') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const alerts = await prisma.emergencyAlert.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ alerts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching alerts:', error);
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

