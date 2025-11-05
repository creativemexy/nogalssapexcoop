import { NextRequest, NextResponse } from 'next/server';
import { sendMail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, message } = body;

    if (!to || !subject || !message) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields: to, subject, message' 
      }, { status: 400 });
    }

    // Convert message to HTML
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #16a34a, #3b82f6); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nogalss Cooperative</h1>
        </div>
        
        <div style="padding: 20px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Test Email from Brevo</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #374151; line-height: 1.6;">
              ${message}
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            This is a test email sent via Brevo API integration.
          </p>
        </div>
        
        <div style="background: #1f2937; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0;">© 2025 Nogalss Cooperative. All rights reserved.</p>
        </div>
      </div>
    `;

    const result = await sendMail({
      to,
      subject,
      html,
      text: message
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully via Brevo!',
      messageId: result.messageId,
      provider: result.provider
    });

  } catch (error: any) {
    console.error('Brevo test error:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Failed to send email: ${error.message}` 
    }, { status: 500 });
  }
}




