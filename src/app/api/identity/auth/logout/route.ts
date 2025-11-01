import { NextRequest, NextResponse } from 'next/server';
import { identityService } from '@/lib/identity-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;
    
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token is required' },
        { status: 400 }
      );
    }

    console.log('🚪 User logout attempt');

    // Logout user
    await identityService.logout(refreshToken);

    console.log('✅ User logged out successfully');

    return NextResponse.json({
      success: true,
      message: 'Logout successful',
    });

  } catch (error: any) {
    console.error('❌ Logout error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Logout failed' 
      },
      { status: 500 }
    );
  }
}
