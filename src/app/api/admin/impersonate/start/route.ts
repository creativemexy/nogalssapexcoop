import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession, logImpersonationEvent } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { impersonateSchema } from '@/lib/validation';
import { validateRequest } from '@/middleware/validation';

export async function POST(request: NextRequest) {
  // Get session and validate with proper type safety
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;
  
  // Validate request with comprehensive input validation
  const validationResult = await validateRequest(request, {
    bodySchema: impersonateSchema,
    contentType: 'application/json',
    csrf: true
  });

  if (!validationResult.success) {
    return (validationResult as any).response;
  }

  const { targetUserId, reason } = validationResult.data!;

  try {
    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    if (!targetUser.isActive) {
      return NextResponse.json({ error: 'Target user is inactive' }, { status: 400 });
    }

    // Prevent impersonating other super admins
    if (targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cannot impersonate other super admins' }, { status: 403 });
    }

    // Log impersonation start
    await logImpersonationEvent(user.id, targetUserId, 'START', {
      reason: reason || 'No reason provided',
      targetUserEmail: targetUser.email,
      targetUserRole: targetUser.role,
      timestamp: new Date().toISOString(),
    });

    // Create impersonation session data
    const impersonationData = {
      originalAdminId: user.id,
      originalAdminEmail: user.email,
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      targetUserRole: targetUser.role,
      startTime: new Date().toISOString(),
      reason: reason || 'No reason provided',
    };

    return NextResponse.json({
      success: true,
      message: 'Impersonation started successfully',
      impersonationData,
    });

  } catch (error) {
    console.error('Error starting impersonation:', error);
    return NextResponse.json({ error: 'Failed to start impersonation' }, { status: 500 });
  }
}

