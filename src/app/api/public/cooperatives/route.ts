import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all active cooperatives
    const cooperatives = await prisma.cooperative.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        registrationNumber: true,
        city: true,
        state: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Format the response
    const formattedCooperatives = cooperatives.map(coop => ({
      code: coop.registrationNumber,
      name: coop.name,
      location: `${coop.city}, ${coop.state}`
    }));

    return NextResponse.json({
      cooperatives: formattedCooperatives,
      total: formattedCooperatives.length
    });

  } catch (error) {
    console.error('Error fetching cooperatives:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch cooperatives',
      cooperatives: []
    }, { status: 500 });
  }
}
