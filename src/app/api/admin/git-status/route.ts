import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GitUpdater } from '@/lib/git-updater';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin or apex
    if ((session.user as any).role !== 'SUPER_ADMIN' && (session.user as any).role !== 'APEX') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updater = new GitUpdater();
    
    // Get current status
    const currentStatus = await updater.getCurrentStatus();
    
    // Check for updates
    const updateStatus = await updater.checkForUpdates();

    return NextResponse.json({
      current: currentStatus,
      updates: updateStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Git status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
