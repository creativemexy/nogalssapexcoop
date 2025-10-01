import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession } from '@/lib/security';
import { securityConfig } from '@/lib/security-config';

export async function GET() {
  try {
    // Get session and validate with proper type safety
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    // Perform security audit
    const audit = securityConfig.performSecurityAudit();

    return NextResponse.json(audit, { status: 200 });
  } catch (error) {
    console.error('Error performing security audit:', error);
    return NextResponse.json({ error: 'Failed to perform security audit' }, { status: 500 });
  }
}

