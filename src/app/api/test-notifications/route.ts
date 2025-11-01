import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications';
import { sendMail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { type, email, phoneNumber } = await request.json();

    if (type === 'email') {
      // Test email notification
      await sendMail({
        to: email,
        subject: 'Test Email from Nogalss',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Test Email</h1>
            <p>This is a test email to verify email notifications are working.</p>
            <p>Time: ${new Date().toISOString()}</p>
          </div>
        `,
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Test email sent successfully' 
      });
    }

    if (type === 'sms') {
      // Test SMS notification
      await NotificationService.sendSMS({
        to: phoneNumber,
        message: 'Test SMS from Nogalss - notifications are working!'
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Test SMS sent successfully' 
      });
    }

    if (type === 'registration') {
      // Test registration notifications
      await NotificationService.sendRegistrationConfirmationSMS(
        phoneNumber,
        'TEST',
        email,
        'testpassword123',
        'https://nogalssapexcoop.org/dashboard/test'
      );

      await NotificationService.sendRegistrationConfirmationEmail(
        email,
        'Test User',
        'TEST'
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Test registration notifications sent successfully' 
      });
    }

    return NextResponse.json({ 
      error: 'Invalid test type. Use: email, sms, or registration' 
    }, { status: 400 });

  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 });
  }
}

