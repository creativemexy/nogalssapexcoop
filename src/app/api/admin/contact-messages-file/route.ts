import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getContactMessages } from '@/lib/contact-logger';

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

    const messages = getContactMessages();
    
    return NextResponse.json({
      messages,
      total: messages.length,
      source: 'file-backup'
    });

  } catch (error) {
    console.error('Error fetching file-based contact messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
