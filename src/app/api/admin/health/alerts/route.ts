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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'CRITICAL', 'WARNING', or null for all

    let alerts;
    if (type === 'CRITICAL') {
      alerts = healthMonitor.getCriticalAlerts();
    } else if (type === 'WARNING') {
      alerts = healthMonitor.getWarningAlerts();
    } else {
      alerts = healthMonitor.getAlerts();
    }

    return NextResponse.json({
      alerts,
      count: alerts.length,
      criticalCount: healthMonitor.getCriticalAlerts().length,
      warningCount: healthMonitor.getWarningAlerts().length,
    });
  } catch (error) {
    console.error('Error fetching health alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch health alerts' }, { status: 500 });
  }
}
