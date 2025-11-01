import { getValidatedEnv } from '@/lib/env';

// Security configuration for the application
export class SecurityConfig {
  private static instance: SecurityConfig;
  private env: ReturnType<typeof getValidatedEnv>;

  private constructor() {
    this.env = getValidatedEnv();
  }

  public static getInstance(): SecurityConfig {
    if (!SecurityConfig.instance) {
      SecurityConfig.instance = new SecurityConfig();
    }
    return SecurityConfig.instance;
  }

  // Email security configuration
  public getEmailSecurityConfig() {
    return {
      isProductionEmail: this.env.BREVO_API_KEY && !this.env.BREVO_API_KEY.includes('your_brevo_api_key_here'),
      isSecureConnection: true, // Brevo uses HTTPS
      hasValidCredentials: this.env.BREVO_API_KEY && this.env.BREVO_API_KEY.startsWith('xkeys-'),
      fromAddress: 'noreply@nogalss.org',
    };
  }

  // Encryption security configuration
  public getEncryptionSecurityConfig() {
    return {
      hasCustomKey: this.env.ENCRYPTION_KEY !== 'your-32-character-secret-encryption-key-here',
      hasCustomIV: this.env.ENCRYPTION_IV !== 'your-16-char-iv-here',
      keyLength: this.env.ENCRYPTION_KEY.length,
      ivLength: this.env.ENCRYPTION_IV.length,
    };
  }

  // Database security configuration
  public getDatabaseSecurityConfig() {
    return {
      isSecureConnection: this.env.DATABASE_URL.startsWith('postgresql://'),
      hasCredentials: this.env.DATABASE_URL.includes('@'),
    };
  }

  // Payment security configuration
  public getPaymentSecurityConfig() {
    return {
      isProductionKeys: !this.env.PAYSTACK_SECRET_KEY.includes('test'),
      hasSecretKey: this.env.PAYSTACK_SECRET_KEY.length > 0,
      hasPublicKey: this.env.PAYSTACK_PUBLIC_KEY.length > 0,
    };
  }

  // Application security configuration
  public getApplicationSecurityConfig() {
    return {
      isProduction: this.env.NODE_ENV === 'production',
      isDevelopment: this.env.NODE_ENV === 'development',
      hasValidNextAuthSecret: this.env.NEXTAUTH_SECRET.length >= 32,
      hasValidNextAuthUrl: this.env.NEXTAUTH_URL.startsWith('http'),
    };
  }

  // Security headers configuration
  public getSecurityHeadersConfig() {
    const isProduction = this.env.NODE_ENV === 'production';
    
    return {
      // Content Security Policy
      csp: {
        defaultSrc: ["'self'"],
        scriptSrc: isProduction 
          ? ["'self'", "'unsafe-inline'"] // Remove unsafe-eval in production
          : ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow eval in development
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'", 
          "https://api.paystack.co", 
          "https://api.ethereal.email",
          ...(isProduction ? [] : ["http://localhost:*", "ws://localhost:*"])
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: isProduction,
      },
      
      // CORS configuration
      cors: {
        origin: isProduction 
          ? ['https://nogalssapexcoop.org', 'https://www.nogalssapexcoop.org']
          : ['http://localhost:3000', 'https://nogalssapexcoop.org', 'https://www.nogalssapexcoop.org'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-CSRF-Token',
          'X-Requested-With',
          'Accept',
          'Origin',
        ],
        credentials: true,
        maxAge: 86400, // 24 hours
      },
      
      // HTTPS enforcement
      https: {
        enforce: isProduction,
        redirect: isProduction,
        hsts: isProduction,
        hstsMaxAge: 31536000, // 1 year
        includeSubDomains: isProduction,
        preload: isProduction,
      },
      
      // Additional security headers
      additional: {
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        xXssProtection: '1; mode=block',
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=()',
      },
    };
  }

  // Comprehensive security check
  public performSecurityAudit(): {
    passed: boolean;
    warnings: string[];
    errors: string[];
    score: number;
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    let score = 100;

    // Email security checks
    const emailConfig = this.getEmailSecurityConfig();
    if (!emailConfig.isProductionEmail && this.env.NODE_ENV === 'production') {
      errors.push('Production environment using test email service');
      score -= 30;
    }
    if (!emailConfig.hasValidCredentials && this.env.NODE_ENV === 'production') {
      errors.push('Production environment using test email credentials');
      score -= 20;
    }
    if (!emailConfig.isSecureConnection) {
      warnings.push('Email connection is not secure (not using SSL/TLS)');
      score -= 10;
    }

    // Encryption security checks
    const encryptionConfig = this.getEncryptionSecurityConfig();
    if (!encryptionConfig.hasCustomKey) {
      errors.push('Using default encryption key');
      score -= 25;
    }
    if (!encryptionConfig.hasCustomIV) {
      errors.push('Using default encryption IV');
      score -= 25;
    }
    if (encryptionConfig.keyLength < 32) {
      errors.push('Encryption key is too short');
      score -= 15;
    }
    if (encryptionConfig.ivLength < 16) {
      errors.push('Encryption IV is too short');
      score -= 15;
    }

    // Database security checks
    const databaseConfig = this.getDatabaseSecurityConfig();
    if (!databaseConfig.isSecureConnection) {
      errors.push('Database connection is not secure');
      score -= 20;
    }

    // Payment security checks
    const paymentConfig = this.getPaymentSecurityConfig();
    if (!paymentConfig.isProductionKeys && this.env.NODE_ENV === 'production') {
      errors.push('Production environment using test payment keys');
      score -= 20;
    }
    if (!paymentConfig.hasSecretKey || !paymentConfig.hasPublicKey) {
      errors.push('Payment configuration is incomplete');
      score -= 15;
    }

    // Application security checks
    const appConfig = this.getApplicationSecurityConfig();
    if (!appConfig.hasValidNextAuthSecret) {
      errors.push('NextAuth secret is too weak');
      score -= 10;
    }
    if (!appConfig.hasValidNextAuthUrl) {
      errors.push('NextAuth URL is invalid');
      score -= 5;
    }

    // Security headers checks
    const headersConfig = this.getSecurityHeadersConfig();
    if (!headersConfig.https.enforce && this.env.NODE_ENV === 'production') {
      errors.push('HTTPS enforcement is disabled in production');
      score -= 20;
    }
    if (!headersConfig.https.hsts && this.env.NODE_ENV === 'production') {
      errors.push('HSTS is disabled in production');
      score -= 15;
    }

    return {
      passed: errors.length === 0,
      warnings,
      errors,
      score: Math.max(0, score),
    };
  }

  // Get security recommendations
  public getSecurityRecommendations(): string[] {
    const recommendations: string[] = [];
    const audit = this.performSecurityAudit();

    if (audit.errors.length > 0) {
      recommendations.push('🚨 CRITICAL: Fix all security errors before deployment');
    }

    if (audit.warnings.length > 0) {
      recommendations.push('⚠️  WARNING: Address security warnings for better security');
    }

    if (audit.score < 80) {
      recommendations.push('📊 Security score is low - review configuration');
    }

    if (this.env.NODE_ENV === 'production') {
      recommendations.push('🔒 Production environment detected - ensure all security measures are in place');
    }

    return recommendations;
  }
}

// Export singleton instance
export const securityConfig = SecurityConfig.getInstance();