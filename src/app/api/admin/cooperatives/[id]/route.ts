import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cooperativeId = params.id;

    const cooperative = await prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      include: {
        _count: {
          select: {
            members: true,
            leaders: true
          }
        }
      }
    });

    if (!cooperative) {
      return NextResponse.json({ error: 'Cooperative not found' }, { status: 404 });
    }

    const formattedCooperative = {
      id: cooperative.id,
      name: cooperative.name,
      registrationNumber: cooperative.registrationNumber,
      city: cooperative.city,
      state: cooperative.state,
      status: cooperative.isActive ? 'Active' : 'Inactive',
      createdAt: cooperative.createdAt.toISOString(),
      memberCount: cooperative._count.members,
      leaderCount: cooperative._count.leaders,
      email: cooperative.email,
      phoneNumber: cooperative.phoneNumber,
      address: cooperative.address,
      bankName: cooperative.bankName,
      bankAccountNumber: cooperative.bankAccountNumber
    };

    return NextResponse.json({ cooperative: formattedCooperative });

  } catch (error) {
    console.error('Error fetching cooperative:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cooperativeId = params.id;
    const body = await request.json();

    const updatedCooperative = await prisma.cooperative.update({
      where: { id: cooperativeId },
      data: {
        name: body.name,
        registrationNumber: body.registrationNumber,
        address: body.address,
        city: body.city,
        state: body.state,
        phoneNumber: body.phoneNumber,
        email: body.email,
        bankName: body.bankName,
        bankAccountNumber: body.bankAccountNumber,
        isActive: body.status === 'Active'
      }
    });

    return NextResponse.json({ 
      message: 'Cooperative updated successfully',
      cooperative: updatedCooperative 
    });

  } catch (error) {
    console.error('Error updating cooperative:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
