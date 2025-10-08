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

    const defaultMemberFee = 50000; // ₦500.00 in kobo
    const memberRegistrationFee = memberFeeSetting ? parseInt(memberFeeSetting.value) : defaultMemberFee;

    return NextResponse.json({
      registrationFee: memberRegistrationFee,
      registrationFeeFormatted: `₦${(memberRegistrationFee / 100).toLocaleString()}`,
      currency: 'NGN'
    });

  } catch (error) {
    console.error('Error fetching member registration fee:', error);
    // Return default fee if there's an error
    return NextResponse.json({
      registrationFee: 50000,
      registrationFeeFormatted: '₦500.00',
      currency: 'NGN'
    });
  }
}
