import nodemailer from 'nodemailer';
import { getEmailConfig } from '@/lib/env';

// Get validated email configuration
const emailConfig = getEmailConfig();

const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: {
    user: emailConfig.auth.user,
    pass: emailConfig.auth.pass,
  },
});

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const info = await transporter.sendMail({
      from: emailConfig.from,
      to,
      subject,
      html,
    });
    
    // Only show preview URL in development with test email service
    if (process.env.NODE_ENV === 'development' && emailConfig.host.includes('ethereal')) {
      // eslint-disable-next-line no-console
      console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

export function getPasswordResetLink(email: string, token: string) {
  // You may want to customize this URL to match your frontend
  return `https://nogalssapexcoop.org/auth/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
}
