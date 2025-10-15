import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createLog } from '@/lib/logger';

// GET - Fetch a specific parent organization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin or apex
    const userRole = (session.user as any).role;
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'APEX') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      const organization = await prisma.parentOrganization.findUnique({
        where: { id: params.id },
        include: {
          parent: true,
          children: {
            include: {
              cooperatives: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          cooperatives: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              address: true,
              isActive: true,
              createdAt: true,
            },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }

      return NextResponse.json(organization);
    } catch (error: any) {
      if (error.message?.includes('parentOrganization') || error.code === 'P2021') {
        return NextResponse.json({ 
          error: 'Parent organization table does not exist. Please run database migration first.' 
        }, { status: 503 });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error fetching parent organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a parent organization
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin or apex
    const userRole = (session.user as any).role;
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'APEX') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      contactEmail,
      contactPhone,
      address,
      website,
      logo,
      parentId,
      isActive,
    } = body;

    // Check if organization exists
    let existingOrg;
    try {
      existingOrg = await prisma.parentOrganization.findUnique({
        where: { id: params.id },
      });
    } catch (error: any) {
      if (error.message?.includes('parentOrganization') || error.code === 'P2021') {
        return NextResponse.json({ 
          error: 'Parent organization table does not exist. Please run database migration first.' 
        }, { status: 503 });
      }
      throw error;
    }

    if (!existingOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Validate email format if provided
    if (contactEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        return NextResponse.json({ 
          error: 'Invalid email format' 
        }, { status: 400 });
      }
    }

    // Check if parent organization exists (if parentId is provided)
    if (parentId && parentId !== existingOrg.parentId) {
      const parentOrg = await prisma.parentOrganization.findUnique({
        where: { id: parentId },
      });
      
      if (!parentOrg) {
        return NextResponse.json({ 
          error: 'Parent organization not found' 
        }, { status: 404 });
      }

      // Prevent circular references
      if (parentId === params.id) {
        return NextResponse.json({ 
          error: 'Organization cannot be its own parent' 
        }, { status: 400 });
      }
    }

    // Update the organization
    const organization = await prisma.parentOrganization.update({
      where: { id: params.id },
      data: {
        name,
        description,
        contactEmail,
        contactPhone,
        address,
        website,
        logo,
        parentId: parentId || null,
        isActive: isActive !== undefined ? isActive : existingOrg.isActive,
      },
      include: {
        parent: true,
        children: true,
        cooperatives: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log the action
    await createLog({ 
      action: `Updated parent organization: ${organization.name}`, 
      user: session.user 
    });

    return NextResponse.json(organization);

  } catch (error) {
    console.error('Error updating parent organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Soft delete a parent organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin or apex
    const userRole = (session.user as any).role;
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'APEX') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if organization exists
    let existingOrg;
    try {
      existingOrg = await prisma.parentOrganization.findUnique({
        where: { id: params.id },
        include: {
          children: true,
          cooperatives: true,
        },
      });
    } catch (error: any) {
      if (error.message?.includes('parentOrganization') || error.code === 'P2021') {
        return NextResponse.json({ 
          error: 'Parent organization table does not exist. Please run database migration first.' 
        }, { status: 503 });
      }
      throw error;
    }

    if (!existingOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if organization has children
    if (existingOrg.children.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete organization with child organizations. Please reassign or delete child organizations first.' 
      }, { status: 400 });
    }

    // Check if organization has cooperatives
    if (existingOrg.cooperatives.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete organization with associated cooperatives. Please reassign cooperatives first.' 
      }, { status: 400 });
    }

    // Soft delete the organization
    const organization = await prisma.parentOrganization.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    // Log the action
    await createLog({ 
      action: `Deleted parent organization: ${organization.name}`, 
      user: session.user 
    });

    return NextResponse.json({ message: 'Organization deleted successfully' });

  } catch (error) {
    console.error('Error deleting parent organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
