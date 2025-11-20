import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPasswordExpirationStatus } from '@/lib/password-expiration';

/**
 * Get password expiration status for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const expirationStatus = await getPasswordExpirationStatus(userId);

    return NextResponse.json({
      success: true,
      expirationStatus,
    });
  } catch (error) {
    console.error('Error getting password expiration status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

