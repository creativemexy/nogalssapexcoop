import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ChargeTracker } from '@/lib/charge-tracker';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied. Super admin role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type'); // 'system', 'cooperative', 'user'

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    let stats;

    switch (type) {
      case 'cooperative':
        const cooperativeId = searchParams.get('cooperativeId');
        if (!cooperativeId) {
          return NextResponse.json({ error: 'Cooperative ID required for cooperative stats' }, { status: 400 });
        }
        stats = await ChargeTracker.getCooperativeChargeStats(cooperativeId, start, end);
        break;
      
      case 'user':
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json({ error: 'User ID required for user stats' }, { status: 400 });
        }
        stats = await ChargeTracker.getUserChargeStats(userId, start, end);
        break;
      
      default:
        stats = await ChargeTracker.getSystemChargeStats(start, end);
        break;
    }

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching charge statistics:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

