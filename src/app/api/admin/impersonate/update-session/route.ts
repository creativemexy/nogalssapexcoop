import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  return NextResponse.json({ targetUser: { email: 'stub@example.com', role: 'MEMBER' } });
}

