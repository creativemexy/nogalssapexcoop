import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  location: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
  category: z.string().optional(),
  attendees: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional().default(false),
});

const updateEventSchema = createEventSchema.partial();

// GET /api/events - Get all events (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    const category = searchParams.get('category');
    const upcoming = searchParams.get('upcoming');
    
    const where: any = {
      isActive: true,
    };
    
    // Filter by published status
    if (published === 'true') {
      where.isPublished = true;
    }
    
    // Filter by category
    if (category) {
      where.category = category;
    }
    
    // Filter upcoming events
    if (upcoming === 'true') {
      where.date = {
        gte: new Date()
      };
    }
    
    const events = await prisma.event.findMany({
      where,
      orderBy: { date: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        time: true,
        location: true,
        image: true,
        category: true,
        attendees: true,
        isPublished: true,
        createdAt: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });
    
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/events - Create new event (admin/apex only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['SUPER_ADMIN', 'APEX'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validatedData = createEventSchema.parse(body);
    
    // Convert date string to Date object
    const userId = (session.user as any).id;
    
    const event = await prisma.event.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        date: new Date(validatedData.date),
        time: validatedData.time,
        location: validatedData.location,
        image: validatedData.image,
        category: validatedData.category,
        attendees: validatedData.attendees,
        isPublished: validatedData.isPublished,
        createdBy: userId,
      },
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
    
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


