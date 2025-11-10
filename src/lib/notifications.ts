import * as brevo from '@getbrevo/brevo';
import { prisma } from '@/lib/prisma';

// Initialize Brevo API client
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');

interface EmailNotification {
  to: string;
  subject: string;
  html: string;
}

interface SMSNotification {
  to: string;
  message: string;
}

export function getWelcomeEmailHtml({ name, email, password, resetLink, role, dashboardUrl, virtualAccount, registrationPaid }: {
  name: string;
  email: string;
  password?: string;
  resetLink?: string;
  role: string;
  dashboardUrl: string;
  virtualAccount?: { accountNumber: string; bankName: string; accountName: string };
  registrationPaid?: boolean;
}): string {
  let roleDescription = '';
  let dashboardUsage = '';
  switch (role) {
    case 'FINANCE':
      roleDescription = 'You are a Finance user. You can view all system-wide financial records, inflows, outflows, and generate reports.';
      dashboardUsage = `Access your dashboard here: <a href="${dashboardUrl}">${dashboardUrl}</a>`;
      break;
    case 'APEX':
      roleDescription = 'You are an Apex user. You can manage leaders, cooperatives, and oversee system operations.';
      dashboardUsage = `Access your dashboard here: <a href="${dashboardUrl}">${dashboardUrl}</a>`;
      break;
    case 'APEX_FUNDS':
      roleDescription = 'You are an Apex-Funds user. You can view and manage all Apex-level administrative funds.';
      dashboardUsage = `Access your dashboard here: <a href="${dashboardUrl}">${dashboardUrl}</a>`;
      break;
    case 'NOGALSS_FUNDS':
      roleDescription = 'You are a Nogalss-Funds user. You can view and manage all Nogalss-level administrative funds.';
      dashboardUsage = `Access your dashboard here: <a href="${dashboardUrl}">${dashboardUrl}</a>`;
      break;
    case 'COOPERATIVE':
      roleDescription = 'You are a Cooperative admin. You can manage your organization, view savings, apply for loans, and oversee your members.';
      dashboardUsage = `Access your dashboard here: <a href="${dashboardUrl}">${dashboardUrl}</a>`;
      break;
    case 'LEADER':
      roleDescription = 'You are a Leader. You can manage your cooperative, make savings, apply for loans, and oversee your members.';
      dashboardUsage = `Access your dashboard here: <a href="${dashboardUrl}">${dashboardUrl}</a>`;
      break;
    case 'MEMBER':
      roleDescription = 'You are a Member. You can make savings, apply for loans, and view your transaction history.';
      dashboardUsage = `Access your dashboard here: <a href="${dashboardUrl}">${dashboardUrl}</a>`;
      break;
    case 'PARENT_ORGANIZATION':
      roleDescription = 'You are a Parent Organization admin. You can manage your organization, view cooperatives under your organization, oversee financial activities, and manage your organization settings.';
      dashboardUsage = `Access your dashboard here: <a href="${dashboardUrl}">${dashboardUrl}</a>`;
      break;
    default:
      roleDescription = 'You have been granted access to the Nogalss platform.';
      dashboardUsage = `Access your dashboard here: <a href="${dashboardUrl}">${dashboardUrl}</a>`;
  }

  let loginDetails = '';
  if (password) {
    loginDetails = `<li><b>Email:</b> ${email}</li><li><b>Password:</b> ${password}</li>`;
  } else if (resetLink) {
    loginDetails = `<li><b>Email:</b> ${email}</li><li><b>Password:</b> <a href="${resetLink}">Set your password</a></li>`;
  }

  let virtualAccountHtml = '';
  if (virtualAccount) {
    virtualAccountHtml = `
      <h3>Your Virtual Account Details</h3>
      <ul>
        <li><b>Account Number:</b> ${virtualAccount.accountNumber}</li>
        <li><b>Bank Name:</b> ${virtualAccount.bankName}</li>
        <li><b>Account Name:</b> ${virtualAccount.accountName}</li>
      </ul>
    `;
  }

  let registrationHtml = '';
  if (registrationPaid) {
    registrationHtml = `<p style="color:green;"><b>Your registration fee payment was successful and your account is now active.</b></p>`;
  }

  return `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <h2>Welcome to Nogalss, ${name}!</h2>
      <p>We're excited to have you on board.</p>
      <h3>Your Login Details</h3>
      <ul>${loginDetails}</ul>
      <h3>Your Role</h3>
      <p>${roleDescription}</p>
      <h3>How to Use Your Dashboard</h3>
      <p>${dashboardUsage}</p>
      ${virtualAccountHtml}
      ${registrationHtml}
      <p>If you have any questions, please contact support.</p>
      <p>Best regards,<br/>Nogalss Team</p>
    </div>
  `;
}

export class NotificationService {
  // Email notifications
  static async sendEmail({ to, subject, html }: EmailNotification) {
    let logEntry;
    
    try {
      // Create log entry
      logEntry = await prisma.notificationLog.create({
        data: {
          type: 'EMAIL',
          recipient: to,
          subject,
          message: html.substring(0, 500), // Store first 500 chars
          status: 'PENDING',
          provider: 'brevo',
        },
      });

      if (!process.env.BREVO_API_KEY) {
        throw new Error('BREVO_API_KEY is not configured. Please add your Brevo API key to the environment variables.');
      }

      if (!process.env.BREVO_API_KEY.startsWith('xkeys-') && !process.env.BREVO_API_KEY.startsWith('xkeysib-')) {
        throw new Error('Invalid BREVO_API_KEY format. Brevo API keys should start with "xkeys-" or "xkeysib-".');
      }

      console.log('📧 Sending email via Brevo...');
      
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = html;
      sendSmtpEmail.textContent = html.replace(/<[^>]*>/g, ''); // Strip HTML for text content
      sendSmtpEmail.sender = { name: 'Nogalss Cooperative', email: 'noreply@nogalss.org' };
      sendSmtpEmail.to = [{ email: to, name: to.split('@')[0] }];

      const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
      const messageId: string = (data as any)?.messageId || (data as any)?.body?.messageId || 'brevo-message';

      // Update log with success
      await prisma.notificationLog.update({
        where: { id: logEntry.id },
        data: {
          status: 'SENT',
          providerId: messageId,
          sentAt: new Date(),
        },
      });

      console.log('✅ Email sent successfully via Brevo:', messageId);
      return { messageId, provider: 'brevo' };
      
    } catch (error) {
      console.error('Email notification error:', error);
      
      // Update log with error if not already updated
      if (logEntry) {
        await prisma.notificationLog.update({
          where: { id: logEntry.id },
          data: {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
      
      throw error;
    }
  }

  // SMS notifications (using Termii API)
  static async sendSMS({ to, message }: SMSNotification) {
    let logEntry;
    
    try {
      // Create log entry
      logEntry = await prisma.notificationLog.create({
        data: {
          type: 'SMS',
          recipient: to,
          message: message.substring(0, 500), // Store first 500 chars
          status: 'PENDING',
          provider: 'termii',
        },
      });

      const apiKey = process.env.TERMII_API_KEY;
      const senderId = process.env.TERMII_SENDER_ID;
      
      if (!apiKey || !senderId) {
        throw new Error('Termii API key and sender ID are required');
      }
      
      // Format phone number (remove + and ensure it starts with 234 for Nigeria)
      let formattedNumber = to.replace(/^\+/, '');
      if (!formattedNumber.startsWith('234')) {
        formattedNumber = '234' + formattedNumber.replace(/^0/, '');
      }

      const response = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formattedNumber,
          from: senderId,
          sms: message,
          type: 'plain',
          channel: 'generic',
          api_key: apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Termii API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.code !== 'ok') {
        // Update log with error
        await prisma.notificationLog.update({
          where: { id: logEntry.id },
          data: {
            status: 'FAILED',
            errorMessage: result.message || 'Unknown error',
            cost: 0,
          },
        });
        
        throw new Error(`Termii API Error: ${result.message || 'Unknown error'}`);
      }

      // Update log with success and cost
      await prisma.notificationLog.update({
        where: { id: logEntry.id },
        data: {
          status: 'SENT',
          providerId: result.messageId || result.code || 'unknown',
          cost: result.balance || 0,
          sentAt: new Date(),
        },
      });

      console.log('✅ SMS sent successfully via Termii:', result);
      return { messageId: result.messageId || result.code, provider: 'termii' };
    } catch (error) {
      console.error('SMS notification error:', error);
      
      // Update log with error if not already updated
      if (logEntry) {
        await prisma.notificationLog.update({
          where: { id: logEntry.id },
          data: {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            cost: 0,
          },
        });
      }
      
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
          <p style="margin: 0;">© 2025 Nogalss Cooperative. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail({ to: userEmail, subject, html });
  }

  // Payment confirmation SMS
  static async sendPaymentConfirmationSMS(
    phoneNumber: string,
    amount: number,
    reference: string,
    totalSavings?: number
  ) {
    let message = `Nogalss: Your payment of ₦${amount.toLocaleString()} has been confirmed. Ref: ${reference}`;
    
    if (totalSavings !== undefined) {
      message += `. Total savings: ₦${totalSavings.toLocaleString()}`;
    }
    
    message += '. Thank you!';
    
    return this.sendSMS({ to: phoneNumber, message });
  }

  // Registration confirmation SMS
  static async sendRegistrationConfirmationSMS(
    phoneNumber: string,
    registrationType: string,
    email?: string,
    password?: string,
    dashboardUrl?: string
  ) {
    let message = `Nogalss: Welcome! Your ${registrationType} registration is complete.`;
    
    if (email) {
      message += ` Login: ${email}`;
    }
    
    if (password) {
      message += ` Password: ${password}`;
    }
    
    if (dashboardUrl) {
      message += ` Dashboard: ${dashboardUrl}`;
    }
    
    message += ' Sign in to access your account.';
    
    return this.sendSMS({ to: phoneNumber, message });
  }
}

export function getEmergencyAlertEmailHtml(alert: { title: string; message: string; severity: string; createdAt: Date }) {
  const severityColor = alert.severity === 'CRITICAL' ? '#dc2626' : '#d97706';
  const severityIcon = alert.severity === 'CRITICAL' ? '🚨' : '⚠️';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Emergency Alert - ${alert.title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background-color: ${severityColor}; color: #ffffff; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">
            ${severityIcon} Emergency Alert
          </h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <h2 style="color: ${severityColor}; margin-top: 0; font-size: 20px;">
            ${alert.title}
          </h2>
          
          <div style="background-color: #fef2f2; border-left: 4px solid ${severityColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #374151; line-height: 1.6;">
              ${alert.message}
            </p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>Alert Time:</strong> ${new Date(alert.createdAt).toLocaleString()}
            </p>
            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
              <strong>Severity:</strong> ${alert.severity}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nogalssapexcoop.org/dashboard" style="background-color: ${severityColor}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Dashboard
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            This is an automated emergency alert from Nogalss Cooperative.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
} 

// Emit a dashboard update event to all connected clients
export function emitDashboardUpdate() {
  if (typeof global !== 'undefined' && (global as any).io) {
    (global as any).io.emit('dashboard:update');
  }
}

// Emit a user activity event to all connected clients
export function emitUserActivity(user: { id: string; email: string; role: string }, action: string, metadata?: any) {
  if (typeof global !== 'undefined' && (global as any).io) {
    (global as any).io.emit('user:activity', { user, action, metadata, timestamp: new Date().toISOString() });
  }
} 