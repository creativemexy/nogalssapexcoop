import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
  category: z.string().optional(),
  attendees: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
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
    
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    return NextResponse.json({ event });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/events/[id] - Update event (admin/apex only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'APEX'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validatedData = updateEventSchema.parse(body);
    
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id }
    });
    
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Prepare update data
    const updateData: any = { ...validatedData };
    
    // Convert date string to Date object if provided
    if (validatedData.date) {
      updateData.date = new Date(validatedData.date);
    }
    
    const event = await prisma.event.update({
      where: { id: params.id },
      data: updateData,
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
    
    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    
    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/events/[id] - Delete event (admin/apex only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'APEX'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id }
    });
    
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Soft delete by setting isActive to false
    await prisma.event.update({
      where: { id: params.id },
      data: { isActive: false }
    });
    
    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


