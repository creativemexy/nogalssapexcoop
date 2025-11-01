import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch banks from database
    const banks = await prisma.bank.findMany({
      select: {
        id: true,
        name: true,
        code: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      banks: banks,
      total: banks.length
    });
  } catch (error) {
    console.error('Error fetching banks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banks' },
      { status: 500 }
    );
  }
} 