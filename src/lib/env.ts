import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // NextAuth.js
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  
  // Brevo Email Configuration (Required)
  BREVO_API_KEY: z.string().min(1, 'BREVO_API_KEY is required'),
  
  // Termii SMS Configuration (Optional for development)
  TERMII_API_KEY: z.string().optional(),
  TERMII_SENDER_ID: z.string().optional(),
  
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
  
  // Validate Brevo configuration for production
  if (env.NODE_ENV === 'production') {
    // Ensure Brevo API key is properly configured
    if (!env.BREVO_API_KEY || env.BREVO_API_KEY === 'xkeys-your_brevo_api_key_here') {
      throw new Error('Production environment requires valid Brevo API key. Please configure BREVO_API_KEY with your actual Brevo API key.');
    }
  }
  
  return {
    brevoApiKey: env.BREVO_API_KEY,
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
    console.error('  - RESEND_API_KEY');
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
    
        // Check for valid Brevo API key format
        if (!result.env.BREVO_API_KEY.startsWith('xkeys-')) {
          console.error('❌ Production environment detected invalid Brevo API key format');
          throw new Error('Production environment requires valid Brevo API key (should start with "xkeys-")');
        }
        
        // Check for valid Termii API key format (only if provided)
        if (result.env.TERMII_API_KEY && !result.env.TERMII_API_KEY.startsWith('TL')) {
          console.error('❌ Production environment detected invalid Termii API key format');
          throw new Error('Production environment requires valid Termii API key (should start with "TL")');
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
