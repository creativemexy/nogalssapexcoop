import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json({ 
        message: 'Phone number and message are required' 
      }, { status: 400 });
    }

    console.log('📱 Testing Termii SMS integration...');
    console.log('=====================================');
    console.log(`Phone: ${phone}`);
    console.log(`Message: ${message}`);

    // Test SMS notification
    const result = await NotificationService.sendSMS({
      to: phone,
      message: message
    });

    console.log('✅ Termii SMS sent successfully!');
    console.log('📱 Result:', result);

    return NextResponse.json({
      success: true,
      message: 'SMS sent successfully via Termii',
      result: result
    });

  } catch (error) {
    console.error('❌ Termii SMS test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to send SMS via Termii',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Termii SMS Test Endpoint',
    usage: 'POST with { "phone": "08012345678", "message": "Test message" }',
    note: 'Phone number will be automatically formatted for Nigeria (+234)'
  });
}
