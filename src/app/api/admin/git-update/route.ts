import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GitUpdater } from '@/lib/git-updater';

export async function POST(request: NextRequest) {
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
    
    // Perform the update
    const result = await updater.updateCode();

    // Log the update attempt
    console.log(`Git update attempted by ${session.user.email}:`, {
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      output: result.output,
      error: result.error,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Git update error:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Update failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
