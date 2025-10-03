import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for impersonation data in request headers
    const impersonationData = request.headers.get('x-impersonation-data');
    let targetUserId = (session.user as any).id;
    let userRole = (session.user as any).role;

    // If impersonation data is provided, use that instead of session data
    if (impersonationData) {
      try {
        const impersonatedUser = JSON.parse(impersonationData);
        targetUserId = impersonatedUser.id;
        userRole = impersonatedUser.role;
      } catch (error) {
        console.error('Error parsing impersonation data:', error);
      }
    }

    if (userRole !== 'LEADER') {
      return NextResponse.json({ error: 'Access denied. Leader role required.' }, { status: 403 });
    }

    const virtualAccount = await prisma.virtualAccount.findUnique({
      where: { userId: targetUserId },
      select: {
        accountName: true,
        accountNumber: true,
        bankName: true,
        bankCode: true,
        customerCode: true,
        isActive: true,
      }
    });

    if (!virtualAccount) {
      return NextResponse.json({
        virtualAccount: null,
        message: 'No virtual account found for this leader'
      }, { status: 200 });
    }

    return NextResponse.json({ virtualAccount });

  } catch (error) {
    console.error('Error fetching leader virtual account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
