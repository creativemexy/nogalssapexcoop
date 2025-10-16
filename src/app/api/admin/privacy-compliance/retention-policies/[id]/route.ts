import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { dataType, retentionPeriod, description, legalBasis, isActive } = body;

    if (!dataType || !retentionPeriod || !description || !legalBasis) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update retention policy
    const policy = await prisma.dataRetentionPolicy.update({
      where: { id },
      data: {
        dataCategory: dataType, // Map dataType to dataCategory
        retentionPeriod,
        description,
        legalBasis,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      policy,
    });

  } catch (error) {
    console.error('Retention policy update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    // Delete retention policy
    await prisma.dataRetentionPolicy.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Retention policy deleted successfully',
    });

  } catch (error) {
    console.error('Retention policy deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
