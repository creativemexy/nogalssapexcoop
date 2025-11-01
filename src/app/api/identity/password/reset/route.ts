import { NextRequest, NextResponse } from 'next/server';
import { identityService, PasswordResetSchema } from '@/lib/identity-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = PasswordResetSchema.parse(body);
    
    console.log('🔑 Password reset attempt');

    // Reset password
    await identityService.resetPassword(validatedData);

    console.log('✅ Password reset successful');

    return NextResponse.json({
      success: true,
      message: 'Password reset successful',
    });

  } catch (error: any) {
    console.error('❌ Password reset error:', error);
    
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
        message: error.message || 'Password reset failed' 
      },
      { status: 400 }
    );
  }
}
