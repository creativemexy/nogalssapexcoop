import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const { email, phone } = await request.json();

    if (!email && !phone) {
      return NextResponse.json({ error: 'Email or phone is required' }, { status: 400 });
    }

    console.log('Testing notifications...');
    console.log('Email:', email);
    console.log('Phone:', phone);

    const results = [];

    // Test email notification
    if (email) {
      try {
        console.log('Sending test email to:', email);
        const emailResult = await NotificationService.sendEmail({
          to: email,
          subject: 'Test Email from Nogalss',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Test Email from Nogalss</h2>
              <p>This is a test email to verify that the notification system is working correctly.</p>
              <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
              <p>If you received this email, the notification system is working properly!</p>
              <p>Best regards,<br>Nogalss Team</p>
            </div>
          `
        });
        
        console.log('✅ Email sent successfully!', emailResult);
        results.push({ type: 'email', success: true, result: emailResult });
      } catch (error: any) {
        console.error('Email notification error:', error);
        results.push({ type: 'email', success: false, error: error.message });
      }
    }

    // Test SMS notification
    if (phone) {
      try {
        console.log('Sending test SMS to:', phone);
        const smsResult = await NotificationService.sendSMS({
          to: phone,
          message: `Test SMS from Nogalss - ${new Date().toLocaleString()}. If you received this, SMS notifications are working!`
        });
        
        console.log('✅ SMS sent successfully!', smsResult);
        results.push({ type: 'sms', success: true, result: smsResult });
      } catch (error: any) {
        console.error('SMS notification error:', error);
        results.push({ type: 'sms', success: false, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notification test completed',
      results: results
    });

  } catch (error: any) {
    console.error('Test notification error:', error);
    return NextResponse.json({
      error: 'Test notification failed',
      details: error.message
    }, { status: 500 });
  }
}
