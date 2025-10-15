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

    // Check if user is a parent organization
    const userRole = (session.user as any).role;
    if (userRole !== 'PARENT_ORGANIZATION') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find the parent organization associated with this user
    const organization = await prisma.parentOrganization.findUnique({
      where: { userId: (session.user as any).id },
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
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
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

  } catch (error) {
    console.error('Error fetching parent organization profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
