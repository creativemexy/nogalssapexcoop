import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');
    const category = searchParams.get('category');

    // Build where clause
    let whereClause: any = {
      isPublished: true,
      isActive: true,
      date: {
        gte: new Date() // Only upcoming events
      }
    };

    if (category && category !== 'all') {
      whereClause.category = category;
    }

    // Fetch events from database
    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { date: 'asc' },
      take: limit
    });

    // Format events for frontend
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      category: event.category,
      image: event.image,
      attendees: event.attendees,
      creator: event.creator ? `${event.creator.firstName} ${event.creator.lastName}` : 'Nogalss Team'
    }));

    return NextResponse.json({
      events: formattedEvents,
      total: formattedEvents.length
    });

  } catch (error) {
    console.error('Error fetching public events:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch events',
      events: [],
      total: 0
    }, { status: 500 });
  }
}
