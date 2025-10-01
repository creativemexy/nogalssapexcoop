import { validateEnvironmentOnStartup } from '@/lib/env';

// Run environment validation on startup
export function initializeApplication(): void {
  console.log('🚀 Initializing Nogalss Cooperative Application...');
  
  try {
    // Validate environment variables
    validateEnvironmentOnStartup();
    
    console.log('✅ Application initialization completed successfully');
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    throw error;
  }
}

// Export for use in other files
export { validateEnvironmentOnStartup };
