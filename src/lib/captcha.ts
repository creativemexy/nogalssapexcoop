/**
 * CAPTCHA verification utility
 * Uses Google reCAPTCHA v2
 */

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export const CAPTCHA_CONFIG = {
  REQUIRED_AFTER_FAILED_ATTEMPTS: 3, // Show CAPTCHA after 3 failed attempts
  ENABLED: true, // Can be disabled via environment variable
} as const;

/**
 * Verify reCAPTCHA token with Google
 */
export async function verifyCaptcha(token: string): Promise<boolean> {
  if (!RECAPTCHA_SECRET_KEY) {
    console.warn('RECAPTCHA_SECRET_KEY not set, skipping CAPTCHA verification');
    return true; // Allow login if CAPTCHA is not configured
  }

  if (!token) {
    return false;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return false;
  }
}

/**
 * Check if CAPTCHA is required based on failed login attempts
 */
export async function isCaptchaRequired(
  identifier: string, // email, phone, or IP address
  failedAttempts: number
): Promise<boolean> {
  if (!CAPTCHA_CONFIG.ENABLED) {
    return false;
  }

  return failedAttempts >= CAPTCHA_CONFIG.REQUIRED_AFTER_FAILED_ATTEMPTS;
}

/**
 * Get CAPTCHA site key for frontend
 */
export function getCaptchaSiteKey(): string | null {
  return RECAPTCHA_SITE_KEY || null;
}

