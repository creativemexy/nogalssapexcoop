/**
 * NDPA Configuration and Environment Variables
 * Centralized configuration for Nigeria Data Protection Act compliance
 */

export interface NDPAConfig {
  // Data Protection Officer Contact
  dpoEmail: string;
  dpoPhone: string;
  
  // Data Protection Authority
  authorityName: string;
  authorityEmail: string;
  authorityPhone: string;
  
  // Data Retention Defaults
  defaultRetentionPeriod: number; // in days
  financialDataRetention: number; // in days
  personalDataRetention: number; // in days
  
  // Breach Notification
  breachNotificationPeriod: number; // in hours
  authorityNotificationRequired: boolean;
  dataSubjectNotificationRequired: boolean;
  
  // Security Settings
  encryptionRequired: boolean;
  auditLogRetention: number; // in days
  sessionTimeout: number; // in minutes
  
  // Consent Management
  consentVersion: string;
  consentWithdrawalEnabled: boolean;
  
  // Data Subject Rights
  requestProcessingPeriod: number; // in days
  identityVerificationRequired: boolean;
  
  // Privacy by Design
  dataMinimizationEnabled: boolean;
  purposeLimitationEnabled: boolean;
  storageLimitationEnabled: boolean;
}

export class NDPAConfigManager {
  private static config: NDPAConfig;

  /**
   * Initialize NDPA configuration from environment variables
   */
  static initialize(): NDPAConfig {
    this.config = {
      // Data Protection Officer Contact
      dpoEmail: process.env.DPO_EMAIL || 'privacy@nogalss.org',
      dpoPhone: process.env.DPO_PHONE || '+234 XXX XXX XXXX',
      
      // Data Protection Authority
      authorityName: process.env.DPA_NAME || 'Nigeria Data Protection Commission',
      authorityEmail: process.env.DPA_EMAIL || 'info@ndpc.gov.ng',
      authorityPhone: process.env.DPA_PHONE || '+234 XXX XXX XXXX',
      
      // Data Retention Defaults
      defaultRetentionPeriod: parseInt(process.env.DEFAULT_RETENTION_PERIOD || '1095'), // 3 years
      financialDataRetention: parseInt(process.env.FINANCIAL_RETENTION_PERIOD || '2555'), // 7 years
      personalDataRetention: parseInt(process.env.PERSONAL_RETENTION_PERIOD || '1095'), // 3 years
      
      // Breach Notification
      breachNotificationPeriod: parseInt(process.env.BREACH_NOTIFICATION_PERIOD || '72'), // 72 hours
      authorityNotificationRequired: process.env.AUTHORITY_NOTIFICATION_REQUIRED === 'true',
      dataSubjectNotificationRequired: process.env.DATA_SUBJECT_NOTIFICATION_REQUIRED === 'true',
      
      // Security Settings
      encryptionRequired: process.env.ENCRYPTION_REQUIRED !== 'false',
      auditLogRetention: parseInt(process.env.AUDIT_LOG_RETENTION || '2555'), // 7 years
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '30'), // 30 minutes
      
      // Consent Management
      consentVersion: process.env.CONSENT_VERSION || '1.0',
      consentWithdrawalEnabled: process.env.CONSENT_WITHDRAWAL_ENABLED !== 'false',
      
      // Data Subject Rights
      requestProcessingPeriod: parseInt(process.env.REQUEST_PROCESSING_PERIOD || '30'), // 30 days
      identityVerificationRequired: process.env.IDENTITY_VERIFICATION_REQUIRED !== 'false',
      
      // Privacy by Design
      dataMinimizationEnabled: process.env.DATA_MINIMIZATION_ENABLED !== 'false',
      purposeLimitationEnabled: process.env.PURPOSE_LIMITATION_ENABLED !== 'false',
      storageLimitationEnabled: process.env.STORAGE_LIMITATION_ENABLED !== 'false'
    };

    return this.config;
  }

  /**
   * Get current NDPA configuration
   */
  static getConfig(): NDPAConfig {
    if (!this.config) {
      this.initialize();
    }
    return this.config;
  }

  /**
   * Validate NDPA configuration
   */
  static validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.getConfig();

    // Validate required fields
    if (!config.dpoEmail || !config.dpoEmail.includes('@')) {
      errors.push('DPO email is required and must be valid');
    }

    if (!config.dpoPhone) {
      errors.push('DPO phone is required');
    }

    if (config.defaultRetentionPeriod <= 0) {
      errors.push('Default retention period must be greater than 0');
    }

    if (config.financialDataRetention <= 0) {
      errors.push('Financial data retention period must be greater than 0');
    }

    if (config.personalDataRetention <= 0) {
      errors.push('Personal data retention period must be greater than 0');
    }

    if (config.breachNotificationPeriod <= 0 || config.breachNotificationPeriod > 168) {
      errors.push('Breach notification period must be between 1 and 168 hours');
    }

    if (config.requestProcessingPeriod <= 0 || config.requestProcessingPeriod > 90) {
      errors.push('Request processing period must be between 1 and 90 days');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get data retention period for specific data category
   */
  static getRetentionPeriod(dataCategory: string): number {
    const config = this.getConfig();
    
    switch (dataCategory.toLowerCase()) {
      case 'financial':
      case 'transaction':
      case 'payment':
        return config.financialDataRetention;
      
      case 'personal':
      case 'contact':
      case 'profile':
        return config.personalDataRetention;
      
      default:
        return config.defaultRetentionPeriod;
    }
  }

  /**
   * Check if breach notification is required
   */
  static isBreachNotificationRequired(
    categories: string[],
    approximateDataSubjects: number
  ): boolean {
    const config = this.getConfig();
    
    // High-risk categories
    const highRiskCategories = ['financial', 'biometric', 'health', 'criminal'];
    const hasHighRiskCategory = categories.some(cat => 
      highRiskCategories.includes(cat.toLowerCase())
    );
    
    // High data subject count
    const hasHighDataSubjectCount = approximateDataSubjects > 100;
    
    return hasHighRiskCategory || hasHighDataSubjectCount;
  }

  /**
   * Get consent form configuration
   */
  static getConsentFormConfig() {
    const config = this.getConfig();
    
    return {
      version: config.consentVersion,
      withdrawalEnabled: config.consentWithdrawalEnabled,
      dpoContact: {
        email: config.dpoEmail,
        phone: config.dpoPhone
      },
      processingPeriod: config.requestProcessingPeriod,
      identityVerification: config.identityVerificationRequired
    };
  }

  /**
   * Get security configuration
   */
  static getSecurityConfig() {
    const config = this.getConfig();
    
    return {
      encryptionRequired: config.encryptionRequired,
      auditLogRetention: config.auditLogRetention,
      sessionTimeout: config.sessionTimeout,
      dataMinimization: config.dataMinimizationEnabled,
      purposeLimitation: config.purposeLimitationEnabled,
      storageLimitation: config.storageLimitationEnabled
    };
  }

  /**
   * Get breach response configuration
   */
  static getBreachResponseConfig() {
    const config = this.getConfig();
    
    return {
      notificationPeriod: config.breachNotificationPeriod,
      authorityNotification: config.authorityNotificationRequired,
      dataSubjectNotification: config.dataSubjectNotificationRequired,
      authorityContact: {
        name: config.authorityName,
        email: config.authorityEmail,
        phone: config.authorityPhone
      }
    };
  }

  /**
   * Update configuration (for admin use)
   */
  static updateConfig(updates: Partial<NDPAConfig>): NDPAConfig {
    this.config = { ...this.config, ...updates };
    return this.config;
  }

  /**
   * Export configuration for backup
   */
  static exportConfig(): string {
    return JSON.stringify(this.getConfig(), null, 2);
  }

  /**
   * Import configuration from backup
   */
  static importConfig(configJson: string): NDPAConfig {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = { ...this.config, ...importedConfig };
      return this.config;
    } catch (error) {
      throw new Error('Invalid configuration format');
    }
  }
}

// Initialize configuration on module load
NDPAConfigManager.initialize();

