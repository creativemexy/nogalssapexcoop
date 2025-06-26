import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'APEX') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await req.json();

    // Update the cooperative
    const updatedCooperative = await prisma.cooperative.update({
      where: { id },
      data: {
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        approved: body.approved !== undefined ? body.approved : undefined,
        // Add other fields that can be updated
        name: body.name || undefined,
        phoneNumber: body.phoneNumber || undefined,
        email: body.email || undefined,
        address: body.address || undefined,
        city: body.city || undefined,
        bankName: body.bankName || undefined,
        bankAccountNumber: body.bankAccountNumber || undefined,
        description: body.description || undefined,
      },
      include: {
        bank: true,
      },
    });

    const formatted = {
      id: updatedCooperative.id,
      name: updatedCooperative.name,
      registrationNumber: updatedCooperative.registrationNumber,
      address: updatedCooperative.address,
      city: updatedCooperative.city,
      phoneNumber: updatedCooperative.phoneNumber,
      email: updatedCooperative.email,
      bankName: updatedCooperative.bankName,
      bankAccountNumber: updatedCooperative.bankAccountNumber,
      description: updatedCooperative.description || '',
      isActive: updatedCooperative.isActive,
      approved: updatedCooperative.approved || false,
      createdAt: updatedCooperative.createdAt.toISOString(),
    };

    return NextResponse.json({ cooperative: formatted });
  } catch (e) {
    console.error('Error updating cooperative:', e);
    return NextResponse.json({ error: 'Failed to update cooperative' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'APEX') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;

    const cooperative = await prisma.cooperative.findUnique({
      where: { id },
      include: {
        bank: true,
      },
    });

    if (!cooperative) {
      return NextResponse.json({ error: 'Cooperative not found' }, { status: 404 });
    }

    const formatted = {
      id: cooperative.id,
      name: cooperative.name,
      registrationNumber: cooperative.registrationNumber,
      address: cooperative.address,
      city: cooperative.city,
      phoneNumber: cooperative.phoneNumber,
      email: cooperative.email,
      bankName: cooperative.bankName,
      bankAccountNumber: cooperative.bankAccountNumber,
      description: cooperative.description || '',
      isActive: cooperative.isActive,
      approved: cooperative.approved || false,
      createdAt: cooperative.createdAt.toISOString(),
    };

    return NextResponse.json({ cooperative: formatted });
  } catch (e) {
    console.error('Error fetching cooperative:', e);
    return NextResponse.json({ error: 'Failed to fetch cooperative' }, { status: 500 });
  }
} 