import { NextRequest, NextResponse } from 'next/server';
import { identityService, RegisterSchema } from '@/lib/identity-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = RegisterSchema.parse(body);
    
    console.log('📝 User registration attempt:', validatedData.email);

    // Register user
    const result = await identityService.register(validatedData);

    console.log('✅ User registered successfully:', result.user.email);

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Registration error:', error);
    
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
        message: error.message || 'Registration failed' 
      },
      { status: 400 }
    );
  }
}
