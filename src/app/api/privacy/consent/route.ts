import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ConsentManager } from '@/lib/consent-manager';
import { AuditLogger } from '@/lib/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, purpose, dataCategories, legalBasis, retentionPeriod } = await request.json();
    const { ipAddress, userAgent } = AuditLogger.extractRequestInfo(request);

    if (action === 'give') {
      // Record consent
      const consent = await ConsentManager.recordConsent({
        dataSubjectId: (session.user as any).id,
        purpose,
        dataCategories: dataCategories || [],
        legalBasis: legalBasis || 'consent',
        retentionPeriod: retentionPeriod || 365,
        ipAddress,
        userAgent
      });

      return NextResponse.json({
        success: true,
        consent,
        message: 'Consent has been recorded successfully'
      });
    } else if (action === 'withdraw') {
      // Withdraw consent
      const success = await ConsentManager.withdrawConsent(
        (session.user as any).id,
        purpose,
        ipAddress,
        userAgent
      );

      return NextResponse.json({
        success,
        message: success ? 'Consent has been withdrawn' : 'Failed to withdraw consent'
      });
    } else {
      return NextResponse.json({
        error: 'Invalid action. Use "give" or "withdraw"'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Consent management error:', error);
    return NextResponse.json({
      error: 'Failed to process consent request'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const purpose = searchParams.get('purpose');

    if (purpose) {
      // Check if consent exists for specific purpose
      const hasConsent = await ConsentManager.hasValidConsent((session.user as any).id, purpose);
      return NextResponse.json({ hasConsent });
    } else {
      // Get all consents for the user
      const consents = await ConsentManager.getDataSubjectConsents((session.user as any).id);
      return NextResponse.json({ consents });
    }

  } catch (error: any) {
    console.error('Failed to fetch consent information:', error);
    return NextResponse.json({
      error: 'Failed to fetch consent information'
    }, { status: 500 });
  }
}
