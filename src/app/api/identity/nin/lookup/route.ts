import { NextRequest, NextResponse } from 'next/server';
import { korapayIdentityService, monoNINLookupService } from '@/lib/korapay-identity';
import { z } from 'zod';

const NINLookupSchema = z.object({
  nin: z.string().min(11, 'NIN must be 11 digits').max(11, 'NIN must be 11 digits'),
  provider: z.enum(['korapay', 'mono']).default('korapay'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = NINLookupSchema.parse(body);
    
    console.log('🔍 NIN lookup request:', {
      nin: validatedData.nin,
      provider: validatedData.provider,
    });

    // Validate NIN format
    if (!korapayIdentityService.validateNIN(validatedData.nin)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid NIN format. NIN must be 11 digits.' 
        },
        { status: 400 }
      );
    }

    let lookupResult;
    let formattedData;

    // Choose lookup provider
    if (validatedData.provider === 'korapay') {
      console.log('Using Korapay Identity API for NIN lookup');
      lookupResult = await korapayIdentityService.lookupNIN(validatedData.nin);
      formattedData = korapayIdentityService.formatNINDataForRegistration(lookupResult.data);
    } else {
      console.log('Using Mono API for NIN lookup');
      lookupResult = await monoNINLookupService.lookupNIN(validatedData.nin);
      formattedData = monoNINLookupService.formatNINDataForRegistration(lookupResult.data);
    }

    console.log('✅ NIN lookup successful:', {
      name: `${formattedData.firstName} ${formattedData.lastName}`,
      nin: formattedData.nin,
      provider: validatedData.provider,
    });

    return NextResponse.json({
      success: true,
      message: 'NIN lookup successful',
      data: formattedData,
      provider: validatedData.provider,
    });

  } catch (error: any) {
    console.error('❌ NIN lookup error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation error', 
          errors: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'NIN lookup failed' 
      },
      { status: 500 }
    );
  }
}
