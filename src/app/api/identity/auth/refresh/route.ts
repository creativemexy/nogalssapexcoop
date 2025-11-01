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

    console.log('🔄 Token refresh attempt');

    // Refresh tokens
    const tokens = await identityService.refreshToken(refreshToken);

    console.log('✅ Tokens refreshed successfully');

    return NextResponse.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: { tokens },
    });

  } catch (error: any) {
    console.error('❌ Token refresh error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Token refresh failed' 
      },
      { status: 401 }
    );
  }
}
