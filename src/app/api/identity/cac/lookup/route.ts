import { NextRequest, NextResponse } from 'next/server';
import { korapayIdentityService, CACLookupResponseSchema } from '@/lib/korapay-identity';
import { z } from 'zod';

const CACLookupRequestSchema = z.object({
  rcNumber: z.string().min(1, 'RC Number is required'),
  registrationType: z.enum(['BN', 'IT', 'RC', 'LP', 'LLP']).default('RC'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rcNumber, registrationType } = CACLookupRequestSchema.parse(body);

    console.log('🔍 CAC lookup request for RC Number:', rcNumber, 'Type:', registrationType);

    // Perform CAC lookup
    const response = await korapayIdentityService.lookupCAC(rcNumber, registrationType);

    // Validate response with schema
    const validatedResponse = CACLookupResponseSchema.parse(response);

    console.log('✅ CAC lookup successful for:', validatedResponse.data.name);

    return NextResponse.json({
      success: true,
      data: validatedResponse.data
    });

  } catch (error: any) {
    console.error('❌ CAC lookup error:', error);
    
    if (error.message.includes('CAC lookup failed')) {
      return NextResponse.json({ 
        error: 'CAC lookup failed. Please check the RC number and try again.' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'An error occurred during CAC lookup. Please try again.' 
    }, { status: 500 });
  }
}
