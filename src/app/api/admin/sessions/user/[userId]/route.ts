import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionManager } from '@/lib/session-manager';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as any).role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userSessions = await SessionManager.getUserSessions(params.userId);
    return NextResponse.json({ sessions: userSessions });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch user sessions' }, { status: 500 });
  }
}

