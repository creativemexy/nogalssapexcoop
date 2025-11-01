import * as brevo from '@getbrevo/brevo';

// Initialize Brevo API client
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');

export async function sendMail({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string }) {
  try {
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
    sendSmtpEmail.textContent = text || html.replace(/<[^>]*>/g, ''); // Strip HTML for text content
    sendSmtpEmail.sender = { name: 'Nogalss Cooperative', email: 'noreply@nogalssapexcoop.org' };
    sendSmtpEmail.to = [{ email: to, name: to.split('@')[0] }];

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    const messageId = (data as any)?.messageId || (data as any)?.body?.messageId || (data as any)?.body?.messageId || 'brevo-message';

    console.log('✅ Email sent successfully via Brevo:', messageId);
    return { messageId, provider: 'brevo' };
    
  } catch (error: any) {
    console.error('Email send error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('Unable to fetch data')) {
      throw new Error('Network connectivity issue with Brevo API. Please check your internet connection and try again.');
    } else if (error.message.includes('API key is invalid')) {
      throw new Error('Invalid Brevo API key. Please check your BREVO_API_KEY in the environment variables.');
    } else if (error.message.includes('BREVO_API_KEY')) {
      throw new Error('Brevo API key not configured. Please add your Brevo API key to the environment variables.');
    } else if (error.response?.body?.message) {
      throw new Error(`Brevo error: ${error.response.body.message}`);
    } else {
      throw error;
    }
  }
}

export function getPasswordResetLink(email: string, token: string) {
  return `https://nogalssapexcoop.org/auth/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
}

// Test Brevo connection
export async function testBrevoConnection() {
  if (!process.env.BREVO_API_KEY) {
    return { success: false, message: 'BREVO_API_KEY not configured' };
  }

  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = 'Brevo Test Email';
    sendSmtpEmail.htmlContent = '<p>This is a test email from Nogalss Cooperative via Brevo.</p>';
    sendSmtpEmail.textContent = 'This is a test email from Nogalss Cooperative via Brevo.';
    sendSmtpEmail.sender = { name: 'Nogalss Cooperative', email: 'noreply@nogalssapexcoop.org' };
    sendSmtpEmail.to = [{ email: 'test@example.com', name: 'Test User' }];

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

    return { success: true, message: 'Brevo connection successful', data };
  } catch (error: any) {
    return { success: false, message: `Connection test failed: ${error.message}` };
  }
}

// Validate Brevo configuration
export function validateBrevoConfig() {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is required but not configured. Please add your Brevo API key to the environment variables.');
  }
  
  if (!process.env.BREVO_API_KEY.startsWith('xkeys-') && !process.env.BREVO_API_KEY.startsWith('xkeysib-')) {
    throw new Error('Invalid BREVO_API_KEY format. Brevo API keys should start with "xkeys-" or "xkeysib-".');
  }
  
  return true;
}