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
    if ((session.user as any).role !== 'PARENT_ORGANIZATION') {
      return NextResponse.json({ error: 'Access denied. Parent organization role required.' }, { status: 403 });
    }

    const userId = (session.user as any).id;

    // Get the parent organization for this user
    const parentOrganization = await prisma.parentOrganization.findFirst({
      where: { userId: userId }
    });

    if (!parentOrganization) {
      return NextResponse.json({ error: 'Parent organization not found' }, { status: 404 });
    }

    // Get all cooperatives under this parent organization
    const cooperatives = await prisma.cooperative.findMany({
      where: {
        parentOrganizationId: parentOrganization.id
      },
      include: {
        leader: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            contributions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      cooperatives
    });

  } catch (error) {
    console.error('Error fetching parent organization cooperatives:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
