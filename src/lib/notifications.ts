import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailNotification {
  to: string;
  subject: string;
  html: string;
}

interface SMSNotification {
  to: string;
  message: string;
}

export class NotificationService {
  // Email notifications
  static async sendEmail({ to, subject, html }: EmailNotification) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Nogalss <noreply@nogalss.com>',
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error('Email sending error:', error);
        throw new Error('Failed to send email');
      }

      return data;
    } catch (error) {
      console.error('Email notification error:', error);
      throw error;
    }
  }

  // SMS notifications (using Twilio)
  static async sendSMS({ to, message }: SMSNotification) {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        throw new Error('Twilio credentials not configured');
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: to,
            From: fromNumber,
            Body: message,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }

      return await response.json();
    } catch (error) {
      console.error('SMS notification error:', error);
      throw error;
    }
  }

  // Payment confirmation email
  static async sendPaymentConfirmationEmail(
    userEmail: string,
    userName: string,
    amount: number,
    reference: string,
    type: string
  ) {
    const subject = 'Payment Confirmation - Nogalss Cooperative';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fb923c, #3b82f6); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nogalss Cooperative</h1>
        </div>
        
        <div style="padding: 20px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Payment Confirmation</h2>
          
          <p>Dear ${userName},</p>
          
          <p>Your payment has been successfully processed.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Payment Details</h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0;"><strong>Amount:</strong></td>
                <td style="padding: 8px 0;">₦${amount.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Type:</strong></td>
                <td style="padding: 8px 0;">${type}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Reference:</strong></td>
                <td style="padding: 8px 0;">${reference}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Date:</strong></td>
                <td style="padding: 8px 0;">${new Date().toLocaleDateString()}</td>
              </tr>
            </table>
          </div>
          
          <p>Thank you for your payment. If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>Nogalss National Apex Cooperative Society Ltd</p>
        </div>
        
        <div style="background: #1f2937; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0;">© 2024 Nogalss Cooperative. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail({ to: userEmail, subject, html });
  }

  // Registration confirmation email
  static async sendRegistrationConfirmationEmail(
    userEmail: string,
    userName: string,
    registrationType: string
  ) {
    const subject = 'Welcome to Nogalss Cooperative';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fb923c, #3b82f6); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Nogalss</h1>
        </div>
        
        <div style="padding: 20px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Registration Successful</h2>
          
          <p>Dear ${userName},</p>
          
          <p>Welcome to Nogalss National Apex Cooperative Society Ltd! Your registration as a ${registrationType} has been completed successfully.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">Next Steps</h3>
            <ul style="color: #374151;">
              <li>Sign in to your account</li>
              <li>Complete your profile</li>
              <li>Explore our services</li>
              <li>Connect with other members</li>
            </ul>
          </div>
          
          <p>We're excited to have you as part of our cooperative community!</p>
          
          <p>Best regards,<br>Nogalss National Apex Cooperative Society Ltd</p>
        </div>
        
        <div style="background: #1f2937; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0;">© 2024 Nogalss Cooperative. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail({ to: userEmail, subject, html });
  }

  // Payment confirmation SMS
  static async sendPaymentConfirmationSMS(
    phoneNumber: string,
    amount: number,
    reference: string
  ) {
    const message = `Nogalss: Your payment of ₦${amount.toLocaleString()} has been confirmed. Ref: ${reference}. Thank you!`;
    
    return this.sendSMS({ to: phoneNumber, message });
  }

  // Registration confirmation SMS
  static async sendRegistrationConfirmationSMS(
    phoneNumber: string,
    registrationType: string
  ) {
    const message = `Nogalss: Welcome! Your ${registrationType} registration is complete. Sign in to access your account.`;
    
    return this.sendSMS({ to: phoneNumber, message });
  }
} 