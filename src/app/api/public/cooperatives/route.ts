import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching cooperatives from database...');
    
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

    console.log(`Found ${cooperatives.length} active cooperatives`);

    // Format the response
    const formattedCooperatives = cooperatives.map(coop => ({
      code: coop.registrationNumber,
      name: coop.name,
      location: `${coop.city}, ${coop.state}`
    }));

    const response = NextResponse.json({
      cooperatives: formattedCooperatives,
      total: formattedCooperatives.length,
      success: true
    });

    // Add CORS headers for better browser compatibility
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('Error fetching cooperatives:', error);
    
    const errorResponse = NextResponse.json({ 
      error: 'Failed to fetch cooperatives',
      cooperatives: [],
      success: false
    }, { status: 500 });
    
    // Add CORS headers even for error responses
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return errorResponse;
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
