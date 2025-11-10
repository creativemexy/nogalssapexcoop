import { NextRequest, NextResponse } from 'next/server';
import { isWithdrawalEnabled } from '@/lib/withdrawal-permissions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (!role) {
      return NextResponse.json({ error: 'Role parameter is required' }, { status: 400 });
    }

    const enabled = await isWithdrawalEnabled(role);

    return NextResponse.json({ 
      enabled 
    });

  } catch (error) {
    console.error('Error checking withdrawal permission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

