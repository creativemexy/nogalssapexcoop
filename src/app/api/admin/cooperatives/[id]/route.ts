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

    // Get cooperative with related data
    const cooperative = await prisma.cooperative.findUnique({
      where: { id: cooperativeId },
      include: {
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true
          }
        },
        leader: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        state: {
          select: {
            name: true
          }
        }
      }
    });

    if (!cooperative) {
      return NextResponse.json({ error: 'Cooperative not found' }, { status: 404 });
    }

    // Calculate member and leader counts
    const memberCount = cooperative.members.filter(user => user.role === 'MEMBER').length;
    const leaderCount = cooperative.leader ? 1 : 0;

    // Format the response
    const formattedCooperative = {
      id: cooperative.id,
      name: cooperative.name,
      registrationNumber: cooperative.registrationNumber,
      city: cooperative.city,
      state: cooperative.state?.name || 'N/A',
      status: cooperative.isActive ? 'Active' : 'Inactive',
      createdAt: cooperative.createdAt.toISOString(),
      memberCount,
      leaderCount,
      email: cooperative.email,
      phoneNumber: cooperative.phoneNumber,
      address: cooperative.address,
      bankName: cooperative.bankName,
      bankAccountNumber: cooperative.bankAccountNumber,
      members: cooperative.members,
      leader: cooperative.leader
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

    // Validate required fields
    const requiredFields = ['name', 'registrationNumber', 'address', 'city', 'state', 'phoneNumber', 'email', 'bankName', 'bankAccountNumber'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Update the cooperative
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cooperativeId = params.id;

    // Check if cooperative has members
    const memberCount = await prisma.user.count({
      where: { cooperativeId }
    });

    if (memberCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete cooperative with existing members. Please remove all members first.' 
      }, { status: 400 });
    }

    // Delete the cooperative
    await prisma.cooperative.delete({
      where: { id: cooperativeId }
    });

    return NextResponse.json({ message: 'Cooperative deleted successfully' });

  } catch (error) {
    console.error('Error deleting cooperative:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
