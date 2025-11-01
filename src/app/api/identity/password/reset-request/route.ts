import { NextRequest, NextResponse } from 'next/server';
import { identityService, PasswordResetRequestSchema } from '@/lib/identity-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = PasswordResetRequestSchema.parse(body);
    
    console.log('🔑 Password reset request for:', validatedData.email);

    // Request password reset
    await identityService.requestPasswordReset(validatedData);

    console.log('✅ Password reset request processed');

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });

  } catch (error: any) {
    console.error('❌ Password reset request error:', error);
    
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
        message: error.message || 'Password reset request failed' 
      },
      { status: 500 }
    );
  }
}
