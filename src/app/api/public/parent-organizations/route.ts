import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch all active parent organizations for the dropdown
    const parentOrganizations = await prisma.parentOrganization.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        contactEmail: true,
        contactPhone: true,
        address: true,
        website: true,
        logo: true,
        parentId: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      parentOrganizations,
    });

  } catch (error: any) {
    console.error('Error fetching parent organizations:', error);
    
    // If the table doesn't exist yet, return empty results
    if (error.message?.includes('parentOrganization') || error.code === 'P2021') {
      return NextResponse.json({
        parentOrganizations: [],
      });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
