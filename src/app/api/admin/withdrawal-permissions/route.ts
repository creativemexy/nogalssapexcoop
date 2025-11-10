import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession } from '@/lib/security';
import { prisma } from '@/lib/prisma';

// User roles that have withdrawal ability
const WITHDRAWAL_ROLES = ['MEMBER', 'LEADER', 'COOPERATIVE', 'PARENT_ORGANIZATION'];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    // Get withdrawal permissions from system settings
    const permissions: Record<string, boolean> = {};
    
    for (const role of WITHDRAWAL_ROLES) {
      const setting = await prisma.systemSettings.findUnique({
        where: {
          category_key: {
            category: 'withdrawal',
            key: `${role}_WITHDRAWAL_ENABLED`,
          },
        },
      });
      
      // Default to disabled (false) if not set
      permissions[role] = setting?.value === 'true';
    }

    return NextResponse.json({ 
      success: true, 
      permissions 
    });

  } catch (error) {
    console.error('Error fetching withdrawal permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    const body = await request.json();
    const { permissions } = body;

    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json({ error: 'Invalid permissions data' }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Update permissions in a transaction
    await prisma.$transaction(async (tx) => {
      for (const role of WITHDRAWAL_ROLES) {
        const key = `${role}_WITHDRAWAL_ENABLED`;
        const enabled = permissions[role] === true;
        
        await tx.systemSettings.upsert({
          where: {
            category_key: {
              category: 'withdrawal',
              key: key,
            },
          },
          update: {
            value: enabled ? 'true' : 'false',
            description: `Withdrawal permission for ${role} users`,
            updatedBy: userId,
            isActive: true,
          },
          create: {
            category: 'withdrawal',
            key: key,
            value: enabled ? 'true' : 'false',
            description: `Withdrawal permission for ${role} users`,
            updatedBy: userId,
            isActive: true,
          },
        });
      }
    });

    // Log the action
    await prisma.log.create({
      data: {
        userId: userId,
        userEmail: session.user.email || 'unknown',
        action: 'Withdrawal permissions updated'
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Withdrawal permissions updated successfully',
      permissions 
    });

  } catch (error) {
    console.error('Error updating withdrawal permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

