import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSessionWithRoles } from '@/lib/security';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSessionWithRoles(session.user, ['SUPER_ADMIN', 'APEX']);
    if ('error' in authResult) {
      return authResult.error;
    }

    // Get registration fee from system settings
    const registrationFeeSetting = await prisma.systemSettings.findFirst({
      where: {
        category: 'payment',
        key: 'registration_fee'
      }
    });

    const defaultFee = 50000; // ₦500.00 in kobo
    const registrationFee = registrationFeeSetting ? parseInt(registrationFeeSetting.value) : defaultFee;

    return NextResponse.json({
      registrationFee,
      registrationFeeFormatted: `₦${(registrationFee / 100).toLocaleString()}`,
      currency: 'NGN'
    });

  } catch (error) {
    console.error('Error fetching registration fee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
  const session = await getServerSession(authOptions);
    if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

    const authResult = requireAuthFromSessionWithRoles(session.user, ['SUPER_ADMIN', 'APEX']);
    if ('error' in authResult) {
      return authResult.error;
    }

    const body = await request.json();
    const { registrationFee } = body;

    if (!registrationFee || registrationFee < 1000) {
      return NextResponse.json({ 
        error: 'Registration fee must be at least ₦10.00 (1000 kobo)' 
      }, { status: 400 });
    }

    // Update or create registration fee setting
    const setting = await prisma.systemSettings.upsert({
      where: { 
        category_key: {
          category: 'payment',
          key: 'registration_fee'
        }
      },
      update: { 
        value: registrationFee.toString(),
        updatedBy: (session.user as any).id
      },
      create: {
        category: 'payment',
        key: 'registration_fee',
        value: registrationFee.toString(),
        description: 'Cooperative registration fee in kobo',
        updatedBy: (session.user as any).id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Registration fee updated successfully',
      registrationFee: parseInt(setting.value),
      registrationFeeFormatted: `₦${(parseInt(setting.value) / 100).toLocaleString()}`,
      currency: 'NGN'
    });

  } catch (error) {
    console.error('Error updating registration fee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 