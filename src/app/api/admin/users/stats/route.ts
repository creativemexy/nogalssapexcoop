import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  return NextResponse.json({ 
    totalUsers: 0, 
    activeUsers: 0, 
    inactiveUsers: 0, 
    roleCounts: {} 
  });
}
