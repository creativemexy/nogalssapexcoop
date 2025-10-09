import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Test if Investment model exists and is accessible
    console.log('Testing Investment model...');
    console.log('Prisma client methods:', Object.keys(prisma));
    console.log('UserInvestment model exists:', 'userInvestment' in prisma);
    
    if (!('userInvestment' in prisma)) {
      return NextResponse.json({
        success: false,
        error: 'UserInvestment model not found in Prisma client',
        availableModels: Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_'))
      });
    }
    
    const investmentCount = await prisma.userInvestment.count();
    
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
