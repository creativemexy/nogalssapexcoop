import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a parent organization
    const userRole = (session.user as any).role;
    if (userRole !== 'PARENT_ORGANIZATION') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get parent organization
    const organization = await prisma.parentOrganization.findUnique({
      where: { userId: (session.user as any).id },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Parent organization not found' }, { status: 404 });
    }

    const body = await request.json();
    const { subject, description, priority, category } = body;

    // Validate required fields
    if (!subject || !description || !priority || !category) {
      return NextResponse.json({ 
        error: 'Subject, description, priority, and category are required' 
      }, { status: 400 });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ 
        error: 'Invalid priority. Must be one of: low, medium, high, urgent' 
      }, { status: 400 });
    }

    // Validate category
    const validCategories = ['technical', 'billing', 'general', 'feature_request'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ 
        error: 'Invalid category. Must be one of: technical, billing, general, feature_request' 
      }, { status: 400 });
    }

    // Create support ticket
    const supportTicket = await prisma['supportTicket'].create({
      data: {
        subject,
        description,
        priority: priority.toUpperCase(),
        category: category.toUpperCase(),
        status: 'OPEN',
        parentOrganizationId: organization.id,
        userId: (session.user as any).id,
      },
      include: {
        parentOrganization: {
          select: {
            name: true,
            contactEmail: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log the support ticket creation
    await prisma.log.create({
      data: {
        userId: (session.user as any).id,
        userEmail: (session.user as any).email,
        action: `Support ticket created: ${supportTicket.id}`,
      },
    });

    return NextResponse.json({
      message: 'Support ticket created successfully',
      ticket: {
        id: supportTicket.id,
        subject: supportTicket.subject,
        status: supportTicket.status,
        priority: supportTicket.priority,
        category: supportTicket.category,
        createdAt: supportTicket.createdAt,
      },
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a parent organization
    const userRole = (session.user as any).role;
    if (userRole !== 'PARENT_ORGANIZATION') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get parent organization
    const organization = await prisma.parentOrganization.findUnique({
      where: { userId: (session.user as any).id },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Parent organization not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';

    // Build where clause
    const where: any = {
      parentOrganizationId: organization.id,
    };

    // Add status filter
    if (status) {
      where.status = status.toUpperCase();
    }

    // Add priority filter
    if (priority) {
      where.priority = priority.toUpperCase();
    }

    // Get total count
    const totalTickets = await prisma['supportTicket'].count({ where });

    // Get support tickets with pagination
    const tickets = await prisma['supportTicket'].findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalTickets / pageSize);

    return NextResponse.json({
      data: {
        tickets,
        totalTickets,
        currentPage: page,
        pageSize,
        totalPages,
      },
    });

  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
