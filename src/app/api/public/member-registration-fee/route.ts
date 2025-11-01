import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get member registration fee from system settings (public endpoint)
    const memberFeeSetting = await prisma.systemSettings.findFirst({
      where: {
        category: 'payment',
        key: 'member_registration_fee'
      }
    });

    if (!memberFeeSetting) {
      return NextResponse.json({
        error: 'Member registration fee not configured in system settings'
      }, { status: 404 });
    }

    const memberRegistrationFee = parseInt(memberFeeSetting.value);

    return NextResponse.json({
      registrationFee: memberRegistrationFee,
      registrationFeeFormatted: `₦${(memberRegistrationFee / 100).toLocaleString()}`,
      currency: 'NGN'
    });

  } catch (error) {
    console.error('Error fetching member registration fee:', error);
    return NextResponse.json({
      error: 'Failed to fetch member registration fee'
    }, { status: 500 });
  }
}
