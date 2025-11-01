import { NextRequest, NextResponse } from 'next/server';
import { korapayClient } from '@/lib/korapay';
import { z } from 'zod';

const InitializePaymentSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  currency: z.string().default('NGN'),
  reference: z.string().min(1, 'Reference is required'),
  customer: z.object({
    name: z.string().min(1, 'Customer name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
  }),
  callback_url: z.string().url('Invalid callback URL'),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = InitializePaymentSchema.parse(body);
    
    console.log('🚀 Initializing Korapay payment:', {
      amount: validatedData.amount,
      reference: validatedData.reference,
      customer: validatedData.customer.email,
    });

    // Initialize payment with Korapay
    const response = await korapayClient.initializePayment({
      amount: validatedData.amount,
      currency: validatedData.currency,
      reference: validatedData.reference,
      customer: {
        name: validatedData.customer.name,
        email: validatedData.customer.email,
        phone: validatedData.customer.phone,
      },
      callback_url: validatedData.callback_url,
      metadata: validatedData.metadata,
    });

    console.log('✅ Korapay payment initialized:', response.data.reference);

    return NextResponse.json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        reference: response.data.reference,
        checkout_url: response.data.checkout_url,
        access_code: response.data.access_code,
        amount: validatedData.amount,
        currency: validatedData.currency,
      },
    });

  } catch (error: any) {
    console.error('❌ Korapay payment initialization error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation error', 
          errors: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to initialize payment' 
      },
      { status: 500 }
    );
  }
}
