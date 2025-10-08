import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get cooperative registration fee from system settings (public endpoint)
    const cooperativeFeeSetting = await prisma.systemSettings.findFirst({
      where: {
        category: 'payment',
        key: 'cooperative_registration_fee'
      }
    });

    const defaultCooperativeFee = 5000000; // ₦50,000.00 in kobo
    const cooperativeRegistrationFee = cooperativeFeeSetting ? parseInt(cooperativeFeeSetting.value) : defaultCooperativeFee;

    return NextResponse.json({
      registrationFee: cooperativeRegistrationFee,
      registrationFeeFormatted: `₦${(cooperativeRegistrationFee / 100).toLocaleString()}`,
      currency: 'NGN'
    });

  } catch (error) {
    console.error('Error fetching cooperative registration fee:', error);
    // Return default fee if there's an error
    return NextResponse.json({
      registrationFee: 5000000,
      registrationFeeFormatted: '₦50,000.00',
      currency: 'NGN'
    });
  }
}
