import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  return NextResponse.json({ rows: [], pagination: { page: 1, pages: 1, count: 0 } });
}

