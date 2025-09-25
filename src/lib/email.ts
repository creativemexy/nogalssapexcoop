import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST || 'smtp.ethereal.email';
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpUser = process.env.SMTP_USER || 'testuser';
const smtpPass = process.env.SMTP_PASS || 'testpass';
const smtpFrom = process.env.SMTP_FROM || 'Nogalss <noreply@nogalss.test>';
const smtpSecure = (process.env.SMTP_SECURE || '').toLowerCase() === 'true' || smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const info = await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      html,
    });
    if (smtpHost === 'smtp.ethereal.email') {
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
