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

    // Get member registration fee from system settings
    const memberFeeSetting = await prisma.systemSettings.findFirst({
      where: {
        category: 'payment',
        key: 'member_registration_fee'
      }
    });

    const defaultFee = 500000; // ₦5,000.00 in kobo
    const registrationFee = memberFeeSetting ? parseInt(memberFeeSetting.value) : defaultFee;

    return NextResponse.json({
      registrationFee,
      registrationFeeFormatted: `₦${(registrationFee / 100).toLocaleString()}`,
      currency: 'NGN'
    });

  } catch (error) {
    console.error('Error fetching member registration fee:', error);
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

    if (!registrationFee || registrationFee < 1000 || registrationFee > 10000000) {
      return NextResponse.json({ 
        error: 'Member registration fee must be between ₦10.00 and ₦100,000.00' 
      }, { status: 400 });
    }

    // Update member registration fee in system settings
    const updatedSetting = await prisma.systemSettings.upsert({
      where: { 
        category_key: {
          category: 'payment',
          key: 'member_registration_fee'
        }
      },
      update: { 
        value: registrationFee.toString(),
        updatedBy: (session.user as any).id
      },
      create: {
        category: 'payment',
        key: 'member_registration_fee',
        value: registrationFee.toString(),
        description: 'Member registration fee in kobo',
        updatedBy: (session.user as any).id
      }
    });

    return NextResponse.json({
      registrationFee: parseInt(updatedSetting.value),
      registrationFeeFormatted: `₦${(parseInt(updatedSetting.value) / 100).toLocaleString()}`,
      currency: 'NGN',
      message: 'Member registration fee updated successfully'
    });

  } catch (error) {
    console.error('Error updating member registration fee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
