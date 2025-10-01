# Email Configuration Options

## Current Issue
- ✅ SMTP connection is working
- ❌ Emails are being flagged as spam (550 Message discarded as high-probability spam)

## Solutions

### Option 1: Use Gmail SMTP (Recommended)
Update your `.env.local` file with Gmail credentials:

```env
# Gmail SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-gmail@gmail.com"
SMTP_PASS="your-app-password"  # Use App Password, not regular password
SMTP_FROM="your-gmail@gmail.com"
SMTP_SECURE="false"
```

**Note**: You need to:
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password (not your regular password)
3. Use the App Password in SMTP_PASS

### Option 2: Use SendGrid (Professional)
```env
# SendGrid Configuration
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
SMTP_FROM="noreply@nogalss.org"
SMTP_SECURE="false"
```

### Option 3: Use Mailgun (Professional)
```env
# Mailgun Configuration
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@your-domain.mailgun.org"
SMTP_PASS="your-mailgun-password"
SMTP_FROM="noreply@nogalss.org"
SMTP_SECURE="false"
```

### Option 4: Fix Current Server (Advanced)
If you want to keep using the current server:
1. Contact your hosting provider to whitelist your domain
2. Set up SPF, DKIM, and DMARC records
3. Use a dedicated IP address
4. Implement proper email authentication

## Quick Fix for Development
For now, you can disable email sending in development by modifying the registration API to not send emails, or use a mock email service.

## Testing
After updating your configuration, run:
```bash
node test-email-connection.js
```


