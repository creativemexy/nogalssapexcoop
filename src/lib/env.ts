import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // NextAuth.js
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  
  // Email Configuration (Required for production)
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.string().regex(/^\d+$/, 'SMTP_PORT must be a number').transform(Number),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  SMTP_FROM: z.string().email('SMTP_FROM must be a valid email'),
  SMTP_SECURE: z.string().optional().transform(val => val === 'true'),
  
  // Paystack Configuration
  PAYSTACK_SECRET_KEY: z.string().min(1, 'PAYSTACK_SECRET_KEY is required'),
  PAYSTACK_PUBLIC_KEY: z.string().min(1, 'PAYSTACK_PUBLIC_KEY is required'),
  
  // Encryption Settings
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),
  ENCRYPTION_IV: z.string().min(16, 'ENCRYPTION_IV must be at least 16 characters'),
  
  // Application Settings
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Validate environment variables
export function validateEnvironment(): { success: true; env: z.infer<typeof envSchema> } | { success: false; errors: string[] } {
  try {
    const env = envSchema.parse(process.env);
    return { success: true, env };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      success: false,
      errors: ['Environment validation failed']
    };
  }
}

// Get validated environment variables
export function getValidatedEnv(): z.infer<typeof envSchema> {
  const result = validateEnvironment();
  if (!result.success) {
    console.error('❌ Environment validation failed:');
    (result as any).errors.forEach((error: string) => console.error(`  - ${error}`));
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    throw new Error('Environment validation failed');
  }
  return result.env;
}

// Environment-specific configurations
export function getEmailConfig() {
  const env = getValidatedEnv();
  
  // Validate email configuration for production
  if (env.NODE_ENV === 'production') {
    // Ensure production email service is configured
    if (env.SMTP_HOST.includes('ethereal') || env.SMTP_HOST.includes('test')) {
      throw new Error('Production environment requires production email service. Please configure SMTP_HOST with a production email provider.');
    }
    
    if (env.SMTP_USER.includes('test') || env.SMTP_PASS.includes('test')) {
      throw new Error('Production environment requires production email credentials. Please configure SMTP_USER and SMTP_PASS with production values.');
    }
  }
  
  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE || env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    from: env.SMTP_FROM,
  };
}

// Security configuration
export function getSecurityConfig() {
  const env = getValidatedEnv();
  
  return {
    encryptionKey: env.ENCRYPTION_KEY,
    encryptionIV: env.ENCRYPTION_IV,
    nextAuthSecret: env.NEXTAUTH_SECRET,
    nextAuthUrl: env.NEXTAUTH_URL,
  };
}

// Database configuration
export function getDatabaseConfig() {
  const env = getValidatedEnv();
  
  return {
    url: env.DATABASE_URL,
  };
}

// Payment configuration
export function getPaymentConfig() {
  const env = getValidatedEnv();
  
  return {
    paystackSecretKey: env.PAYSTACK_SECRET_KEY,
    paystackPublicKey: env.PAYSTACK_PUBLIC_KEY,
  };
}

// Application configuration
export function getAppConfig() {
  const env = getValidatedEnv();
  
  return {
    nodeEnv: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  };
}

// Validate environment on startup
export function validateEnvironmentOnStartup(): void {
  console.log('🔍 Validating environment variables...');
  
  const result = validateEnvironment();
  
  if (!result.success) {
    console.error('❌ Environment validation failed:');
    (result as any).errors.forEach((error: string) => console.error(`  - ${error}`));
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    console.error('\n📋 Required environment variables:');
    console.error('  - DATABASE_URL');
    console.error('  - NEXTAUTH_URL');
    console.error('  - NEXTAUTH_SECRET');
    console.error('  - SMTP_HOST');
    console.error('  - SMTP_PORT');
    console.error('  - SMTP_USER');
    console.error('  - SMTP_PASS');
    console.error('  - SMTP_FROM');
    console.error('  - PAYSTACK_SECRET_KEY');
    console.error('  - PAYSTACK_PUBLIC_KEY');
    console.error('  - ENCRYPTION_KEY');
    console.error('  - ENCRYPTION_IV');
    throw new Error('Environment validation failed');
  }
  
  console.log('✅ Environment variables validated successfully');
  
  // Additional production checks
  if (result.env.NODE_ENV === 'production') {
    console.log('🔒 Running production security checks...');
    
    // Check for test credentials in production
    if (result.env.SMTP_HOST.includes('ethereal') || result.env.SMTP_HOST.includes('test')) {
      console.error('❌ Production environment detected test email service');
      throw new Error('Production environment requires production email service');
    }
    
    if (result.env.SMTP_USER.includes('test') || result.env.SMTP_PASS.includes('test')) {
      console.error('❌ Production environment detected test email credentials');
      throw new Error('Production environment requires production email credentials');
    }
    
    // Check for default encryption keys
    if (result.env.ENCRYPTION_KEY === 'your-32-character-secret-encryption-key-here') {
      console.error('❌ Production environment detected default encryption key');
      throw new Error('Production environment requires custom encryption key');
    }
    
    if (result.env.ENCRYPTION_IV === 'your-16-char-iv-here') {
      console.error('❌ Production environment detected default encryption IV');
      throw new Error('Production environment requires custom encryption IV');
    }
    
    console.log('✅ Production security checks passed');
  }
}
