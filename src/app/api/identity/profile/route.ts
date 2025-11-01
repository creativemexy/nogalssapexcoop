import { NextRequest, NextResponse } from 'next/server';
import { identityService, UpdateProfileSchema } from '@/lib/identity-service';

// Middleware to verify authentication
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header missing or invalid');
  }

  const token = authHeader.substring(7);
  return await identityService.verifyAccessToken(token);
}

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    
    console.log('👤 Getting profile for user:', auth.userId);

    const profile = await identityService.getUserProfile(auth.userId);

    return NextResponse.json({
      success: true,
      data: { profile },
    });

  } catch (error: any) {
    console.error('❌ Get profile error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to get profile' 
      },
      { status: 401 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    const body = await request.json();
    
    // Validate request body
    const validatedData = UpdateProfileSchema.parse(body);
    
    console.log('✏️ Updating profile for user:', auth.userId);

    const updatedProfile = await identityService.updateProfile(auth.userId, validatedData);

    console.log('✅ Profile updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: { profile: updatedProfile },
    });

  } catch (error: any) {
    console.error('❌ Update profile error:', error);
    
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
        message: error.message || 'Profile update failed' 
      },
      { status: 401 }
    );
  }
}
