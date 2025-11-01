import { NextRequest, NextResponse } from 'next/server';
import { identityService, LoginSchema } from '@/lib/identity-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = LoginSchema.parse(body);
    
    console.log('🔐 User login attempt:', validatedData.email);

    // Authenticate user
    const result = await identityService.login(validatedData);

    console.log('✅ User logged in successfully:', result.user.email);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });

  } catch (error: any) {
    console.error('❌ Login error:', error);
    
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
        message: error.message || 'Login failed' 
      },
      { status: 401 }
    );
  }
}
