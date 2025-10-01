import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession } from '@/lib/security';
import { healthMonitor } from '@/lib/health-monitor';

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

    const metrics = await healthMonitor.getMetrics();
    const status = healthMonitor.getHealthStatus();
    const alerts = healthMonitor.getAlerts();

    return NextResponse.json({
      status,
      metrics,
      alerts,
      summary: {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.type === 'CRITICAL').length,
        warningAlerts: alerts.filter(a => a.type === 'WARNING').length,
      },
    });
  } catch (error) {
    console.error('Error fetching health metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch health metrics' }, { status: 500 });
  }
}
