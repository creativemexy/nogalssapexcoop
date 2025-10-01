import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const toggleStatusSchema = z.object({
  isPublished: z.boolean(),
});

// PATCH /api/events/[id]/status - Toggle event published status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'APEX'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { isPublished } = toggleStatusSchema.parse(body);
    
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id }
    });
    
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    const event = await prisma.event.update({
      where: { id: params.id },
      data: { isPublished },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });
    
    return NextResponse.json({ 
      event,
      message: `Event ${isPublished ? 'published' : 'unpublished'} successfully`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    
    console.error('Toggle event status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


