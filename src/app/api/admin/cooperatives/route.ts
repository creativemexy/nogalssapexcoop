import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { registrationNumber: { contains: search, mode: 'insensitive' as const } },
        { city: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const [cooperatives, total] = await Promise.all([
      prisma.cooperative.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              members: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.cooperative.count({ where: whereClause })
    ]);

    const formattedCooperatives = cooperatives.map(coop => ({
      id: coop.id,
      name: coop.name,
      registrationNumber: coop.registrationNumber,
      city: coop.city,
      state: 'Unknown',
      status: coop.isActive ? 'Active' : 'Inactive',
      createdAt: coop.createdAt,
      memberCount: coop._count.members,
      leaderCount: 0,
      email: coop.email,
      phoneNumber: coop.phoneNumber,
      address: coop.address,
      bankName: coop.bankName,
      bankAccountNumber: coop.bankAccountNumber
    }));

    return NextResponse.json({
      cooperatives: formattedCooperatives,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching cooperatives:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      registrationNumber, 
      address, 
      city, 
      state, 
      phoneNumber, 
      email, 
      bankName, 
      bankAccountNumber,
      bankAccountName
    } = body;

    // Validate required fields
    if (!name || !registrationNumber || !address || !city || !state || !phoneNumber || !email || !bankName || !bankAccountNumber || !bankAccountName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if registration number already exists
    const existingCooperative = await prisma.cooperative.findUnique({
      where: { registrationNumber }
    });

    if (existingCooperative) {
      return NextResponse.json({ error: 'A cooperative with this registration number already exists' }, { status: 409 });
    }

    // Create the cooperative
    const cooperative = await prisma.cooperative.create({
      data: {
        name,
        registrationNumber,
        address,
        city,
        state,
        phoneNumber,
        email,
        bankName,
        bankAccountNumber,
        bankAccountName,
        isActive: true
      }
    });

    return NextResponse.json({ 
      message: 'Cooperative created successfully',
      cooperative: {
        id: cooperative.id,
        name: cooperative.name,
        registrationNumber: cooperative.registrationNumber
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating cooperative:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
