/**
 * Nigeria Data Protection Act (NDPA) Compliance Framework
 * This module provides comprehensive data protection compliance utilities
 */

export interface DataSubject {
  id: string;
  email: string;
  phone?: string;
  name: string;
  consentGiven: boolean;
  consentDate?: Date;
  dataRetentionPeriod?: number; // in days
}

export interface DataProcessingActivity {
  id: string;
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  dataCategories: string[];
  recipients: string[];
  retentionPeriod: number; // in days
  securityMeasures: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentRecord {
  id: string;
  dataSubjectId: string;
  purpose: string;
  consentGiven: boolean;
  consentDate: Date;
  withdrawalDate?: Date;
  ipAddress: string;
  userAgent: string;
  consentVersion: string;
}

export interface DataBreach {
  id: string;
  description: string;
  categories: string[];
  approximateDataSubjects: number;
  likelyConsequences: string;
  measuresProposed: string;
  reportedToAuthority: boolean;
  reportedToDataSubjects: boolean;
  reportedAt: Date;
  status: 'detected' | 'investigating' | 'contained' | 'resolved';
}

export class NDPACompliance {
  /**
   * Validate data processing activities for NDPA compliance
   */
  static validateDataProcessing(activity: Partial<DataProcessingActivity>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!activity.purpose) {
      errors.push('Purpose of processing must be specified');
    }

    if (!activity.legalBasis) {
      errors.push('Legal basis for processing must be specified');
    }

    if (!activity.dataCategories || activity.dataCategories.length === 0) {
      errors.push('Data categories must be specified');
    }

    if (!activity.retentionPeriod || activity.retentionPeriod <= 0) {
      errors.push('Retention period must be specified and greater than 0');
    }

    if (!activity.securityMeasures || activity.securityMeasures.length === 0) {
      errors.push('Security measures must be specified');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if data retention period has expired
   */
  static isDataRetentionExpired(createdAt: Date, retentionPeriod: number): boolean {
    const now = new Date();
    const expirationDate = new Date(createdAt.getTime() + (retentionPeriod * 24 * 60 * 60 * 1000));
    return now > expirationDate;
  }

  /**
   * Generate data processing record
   */
  static createDataProcessingRecord(
    purpose: string,
    legalBasis: DataProcessingActivity['legalBasis'],
    dataCategories: string[],
    retentionPeriod: number
  ): DataProcessingActivity {
    return {
      id: `dpa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      purpose,
      legalBasis,
      dataCategories,
      recipients: ['internal_team'],
      retentionPeriod,
      securityMeasures: [
        'encryption_at_rest',
        'encryption_in_transit',
        'access_controls',
        'audit_logging',
        'regular_security_assessments'
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Create consent record
   */
  static createConsentRecord(
    dataSubjectId: string,
    purpose: string,
    ipAddress: string,
    userAgent: string,
    consentVersion: string = '1.0'
  ): ConsentRecord {
    return {
      id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dataSubjectId,
      purpose,
      consentGiven: true,
      consentDate: new Date(),
      ipAddress,
      userAgent,
      consentVersion
    };
  }

  /**
   * Check if consent is valid and not withdrawn
   */
  static isConsentValid(consent: ConsentRecord): boolean {
    return consent.consentGiven && !consent.withdrawalDate;
  }

  /**
   * Anonymize personal data
   */
  static anonymizeData(data: any): any {
    const anonymized = { ...data };
    
    // Remove or hash sensitive fields
    if (anonymized.email) {
      anonymized.email = this.hashEmail(anonymized.email);
    }
    
    if (anonymized.phone) {
      anonymized.phone = this.hashPhone(anonymized.phone);
    }
    
    if (anonymized.name) {
      anonymized.name = this.hashName(anonymized.name);
    }
    
    return anonymized;
  }

  /**
   * Hash email for anonymization
   */
  private static hashEmail(email: string): string {
    const [local, domain] = email.split('@');
    const hashedLocal = this.simpleHash(local);
    return `${hashedLocal}@${domain}`;
  }

  /**
   * Hash phone number for anonymization
   */
  private static hashPhone(phone: string): string {
    if (phone.length <= 4) return '****';
    return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
  }

  /**
   * Hash name for anonymization
   */
  private static hashName(name: string): string {
    const parts = name.split(' ');
    return parts.map(part => 
      part.length <= 2 ? part : part[0] + '*'.repeat(part.length - 2) + part[part.length - 1]
    ).join(' ');
  }

  /**
   * Simple hash function for anonymization
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate data subject rights response
   */
  static generateDataSubjectRightsResponse(dataSubject: DataSubject) {
    return {
      rightToInformation: {
        description: 'You have the right to be informed about how your data is processed',
        data: {
          purposes: ['Account management', 'Service delivery', 'Communication'],
          legalBasis: 'Contract and legitimate interests',
          retentionPeriod: '7 years for financial records, 3 years for other data',
          recipients: ['Internal team only']
        }
      },
      rightOfAccess: {
        description: 'You have the right to access your personal data',
        data: dataSubject
      },
      rightToRectification: {
        description: 'You have the right to correct inaccurate data',
        contact: 'privacy@nogalss.org'
      },
      rightToErasure: {
        description: 'You have the right to request deletion of your data',
        conditions: ['Data no longer necessary', 'Consent withdrawn', 'Unlawful processing'],
        contact: 'privacy@nogalss.org'
      },
      rightToPortability: {
        description: 'You have the right to receive your data in a structured format',
        contact: 'privacy@nogalss.org'
      },
      rightToObject: {
        description: 'You have the right to object to processing',
        contact: 'privacy@nogalss.org'
      }
    };
  }

  /**
   * Create data breach record
   */
  static createDataBreachRecord(
    description: string,
    categories: string[],
    approximateDataSubjects: number,
    likelyConsequences: string,
    measuresProposed: string
  ): DataBreach {
    return {
      id: `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description,
      categories,
      approximateDataSubjects,
      likelyConsequences,
      measuresProposed,
      reportedToAuthority: false,
      reportedToDataSubjects: false,
      reportedAt: new Date(),
      status: 'detected'
    };
  }

  /**
   * Check if data breach notification is required
   */
  static isBreachNotificationRequired(breach: DataBreach): boolean {
    // NDPA requires notification within 72 hours if likely to result in high risk
    return breach.approximateDataSubjects > 100 || 
           breach.categories.includes('financial') || 
           breach.categories.includes('biometric');
  }

  /**
   * Generate privacy impact assessment
   */
  static generatePrivacyImpactAssessment(activity: DataProcessingActivity) {
    return {
      activityId: activity.id,
      purpose: activity.purpose,
      legalBasis: activity.legalBasis,
      dataCategories: activity.dataCategories,
      riskLevel: this.assessRiskLevel(activity),
      mitigationMeasures: activity.securityMeasures,
      dataMinimization: 'Only necessary data is collected',
      purposeLimitation: 'Data is used only for specified purposes',
      storageLimitation: `Data is retained for ${activity.retentionPeriod} days`,
      accuracy: 'Data is kept accurate and up-to-date',
      security: 'Appropriate technical and organizational measures are in place',
      transparency: 'Data subjects are informed about processing activities'
    };
  }

  /**
   * Assess risk level of data processing activity
   */
  private static assessRiskLevel(activity: DataProcessingActivity): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    // High-risk categories
    if (activity.dataCategories.includes('biometric')) riskScore += 3;
    if (activity.dataCategories.includes('financial')) riskScore += 2;
    if (activity.dataCategories.includes('health')) riskScore += 2;
    if (activity.dataCategories.includes('criminal')) riskScore += 3;
    
    // Large-scale processing
    if (activity.recipients.length > 5) riskScore += 1;
    if (activity.retentionPeriod > 365 * 3) riskScore += 1;
    
    if (riskScore >= 5) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }
}

