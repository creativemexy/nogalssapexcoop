import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { validateRequest } from '@/middleware/validation';
import { z } from 'zod';

const updateSessionSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
});

export async function POST(request: NextRequest) {
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

    // Validate request body
    const body = await request.json();
    const validationResult = updateSessionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const { targetUserId } = validationResult.data;

    // Fetch the actual target user data
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        cooperativeId: true,
        cooperative: {
          select: {
            id: true,
            name: true,
            registrationNumber: true
          }
        }
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    if (!targetUser.isActive) {
      return NextResponse.json({ error: 'Target user is inactive' }, { status: 400 });
    }

    // Return the actual user data
    return NextResponse.json({ 
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: targetUser.role,
        isActive: targetUser.isActive,
        cooperative: targetUser.cooperative
      }
    });

  } catch (error) {
    console.error('Error in update-session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


