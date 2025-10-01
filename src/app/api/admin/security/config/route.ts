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

    // Get security configuration
    const config = {
      email: securityConfig.getEmailSecurityConfig(),
      encryption: securityConfig.getEncryptionSecurityConfig(),
      database: securityConfig.getDatabaseSecurityConfig(),
      payment: securityConfig.getPaymentSecurityConfig(),
      application: securityConfig.getApplicationSecurityConfig(),
    };

    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    console.error('Error fetching security configuration:', error);
    return NextResponse.json({ error: 'Failed to fetch security configuration' }, { status: 500 });
  }
}

