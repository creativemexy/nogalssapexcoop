import { NextRequest, NextResponse } from 'next/server';
import { identityService, ChangePasswordSchema } from '@/lib/identity-service';

// Middleware to verify authentication
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header missing or invalid');
  }

  const token = authHeader.substring(7);
  return await identityService.verifyAccessToken(token);
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    const body = await request.json();
    
    // Validate request body
    const validatedData = ChangePasswordSchema.parse(body);
    
    console.log('🔑 Password change attempt for user:', auth.userId);

    // Change password
    await identityService.changePassword(auth.userId, validatedData);

    console.log('✅ Password changed successfully');

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error: any) {
    console.error('❌ Password change error:', error);
    
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
        message: error.message || 'Password change failed' 
      },
      { status: 401 }
    );
  }
}
