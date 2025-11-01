import { NextRequest, NextResponse } from 'next/server';
import { monoNINLookupService } from '@/lib/korapay-identity';
import { z } from 'zod';

const MonoNINLookupSchema = z.object({
  nin: z.string().min(11, 'NIN must be 11 digits').max(11, 'NIN must be 11 digits'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = MonoNINLookupSchema.parse(body);
    
    console.log('🔍 Mono NIN lookup request:', validatedData.nin);

    // Validate NIN format
    if (!/^\d{11}$/.test(validatedData.nin)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid NIN format. NIN must be 11 digits.' 
        },
        { status: 400 }
      );
    }

    // Perform Mono NIN lookup
    const lookupResult = await monoNINLookupService.lookupNIN(validatedData.nin);
    const formattedData = monoNINLookupService.formatNINDataForRegistration(lookupResult.data);

    console.log('✅ Mono NIN lookup successful:', {
      name: `${formattedData.firstName} ${formattedData.lastName}`,
      nin: formattedData.nin,
    });

    return NextResponse.json({
      success: true,
      message: 'Mono NIN lookup successful',
      data: formattedData,
      provider: 'mono',
    });

  } catch (error: any) {
    console.error('❌ Mono NIN lookup error:', error);
    
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
        message: error.message || 'Mono NIN lookup failed' 
      },
      { status: 500 }
    );
  }
}
