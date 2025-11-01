import { NextRequest, NextResponse } from 'next/server';
import { validateBrevoConfig } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing email configuration...');
    validateBrevoConfig();
    return NextResponse.json({
      success: true,
      message: 'Email configuration looks valid'
    });
  } catch (error: any) {
    console.error('Resend test error:', error);
    return NextResponse.json({
      success: false,
      message: `Test failed: ${error.message}`
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, message } = body;
    
    if (!to || !subject || !message) {
      return NextResponse.json({
        success: false,
        message: 'to, subject, and message are required'
      }, { status: 400 });
    }
    
    const { sendMail } = await import('@/lib/email');
    
    const result = await sendMail({
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a;">${subject}</h1>
          <p>${message}</p>
          <p><strong>Sent via:</strong> Resend API</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
      `,
      text: `${subject}\n\n${message}\n\nSent via: Resend API\nTime: ${new Date().toISOString()}`
    });
    
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data: result
    });
    
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json({
      success: false,
      message: `Failed to send email: ${error.message}`
    }, { status: 500 });
  }
}
