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

    if (!cooperativeFeeSetting) {
      return NextResponse.json({
        error: 'Cooperative registration fee not configured in system settings'
      }, { status: 404 });
    }

    const cooperativeRegistrationFee = parseInt(cooperativeFeeSetting.value);

    return NextResponse.json({
      registrationFee: cooperativeRegistrationFee,
      registrationFeeFormatted: `₦${(cooperativeRegistrationFee / 100).toLocaleString()}`,
      currency: 'NGN'
    });

  } catch (error) {
    console.error('Error fetching cooperative registration fee:', error);
    return NextResponse.json({
      error: 'Failed to fetch cooperative registration fee'
    }, { status: 500 });
  }
}
