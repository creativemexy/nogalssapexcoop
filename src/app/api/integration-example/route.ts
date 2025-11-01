import { NextRequest, NextResponse } from 'next/server';
import { korapayClient } from '@/lib/korapay';
import { identityService } from '@/lib/identity-service';

// Example: Integrated payment flow with identity service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userToken, paymentData } = body;

    // Step 1: Verify user identity
    const auth = await identityService.verifyAccessToken(userToken);
    console.log('✅ User authenticated:', auth.userId);

    // Step 2: Initialize payment with Korapay
    const paymentResponse = await korapayClient.initializePayment({
      amount: paymentData.amount,
      currency: paymentData.currency,
      reference: paymentData.reference,
      customer: {
        name: paymentData.customerName,
        email: paymentData.customerEmail,
        phone: paymentData.customerPhone,
      },
      callback_url: `${process.env.NEXTAUTH_URL}/api/korapay/verify`,
      metadata: {
        userId: auth.userId,
        userRole: auth.role,
        paymentType: paymentData.type,
      },
    });

    console.log('✅ Payment initialized:', paymentResponse.data.reference);

    return NextResponse.json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        paymentUrl: paymentResponse.data.checkout_url,
        reference: paymentResponse.data.reference,
        user: {
          id: auth.userId,
          role: auth.role,
        },
      },
    });

  } catch (error: any) {
    console.error('❌ Integration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Integration failed' 
      },
      { status: 500 }
    );
  }
}
