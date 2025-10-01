import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get registration fee from system settings (public endpoint)
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
    // Return default fee if there's an error
    return NextResponse.json({
      registrationFee: 50000,
      registrationFeeFormatted: '₦500.00',
      currency: 'NGN'
    });
  }
}
