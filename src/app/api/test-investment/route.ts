import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Test if Investment model exists and is accessible
    const investmentCount = await prisma.investment.count();
    
    return NextResponse.json({
      success: true,
      message: 'Investment model is accessible',
      count: investmentCount
    });

  } catch (error) {
    console.error('Investment model test error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
