/**
 * Consent Management System for NDPA Compliance
 * Handles consent collection, tracking, and withdrawal
 */

import { prisma } from '@/lib/prisma';
import { AuditLogger } from './audit-logger';

export interface ConsentRequest {
  dataSubjectId: string;
  purpose: string;
  dataCategories: string[];
  legalBasis: string;
  retentionPeriod: number;
  ipAddress: string;
  userAgent: string;
  consentVersion?: string;
}

export interface ConsentResponse {
  consentId: string;
  consentGiven: boolean;
  consentDate: Date;
  purposes: string[];
  dataCategories: string[];
  retentionPeriod: number;
  withdrawalInstructions: string;
}

export class ConsentManager {
  /**
   * Record consent given by data subject
   */
  static async recordConsent(consentRequest: ConsentRequest): Promise<ConsentResponse> {
    try {
      // Check if consent already exists for this purpose
      const existingConsent = await prisma.consentRecord.findFirst({
        where: {
          dataSubjectId: consentRequest.dataSubjectId,
          purpose: consentRequest.purpose,
          consentGiven: true,
          withdrawalDate: null
        }
      });

      if (existingConsent) {
        throw new Error('Consent already exists for this purpose');
      }

      // Create consent record
      const consent = await prisma.consentRecord.create({
        data: {
          dataSubjectId: consentRequest.dataSubjectId,
          purpose: consentRequest.purpose,
          consentGiven: true,
          consentDate: new Date(),
          ipAddress: consentRequest.ipAddress,
          userAgent: consentRequest.userAgent,
          consentVersion: consentRequest.consentVersion || '1.0'
        }
      });

      // Log consent event
      await AuditLogger.logConsentEvent(
        consentRequest.dataSubjectId,
        'consent_given',
        consentRequest.purpose,
        consentRequest.ipAddress,
        consentRequest.userAgent,
        consentRequest.consentVersion
      );

      return {
        consentId: consent.id,
        consentGiven: true,
        consentDate: consent.consentDate,
        purposes: [consentRequest.purpose],
        dataCategories: consentRequest.dataCategories,
        retentionPeriod: consentRequest.retentionPeriod,
        withdrawalInstructions: 'You can withdraw consent at any time by contacting privacy@nogalss.org'
      };
    } catch (error) {
      console.error('Failed to record consent:', error);
      throw error;
    }
  }

  /**
   * Withdraw consent
   */
  static async withdrawConsent(
    dataSubjectId: string,
    purpose: string,
    ipAddress: string,
    userAgent: string
  ): Promise<boolean> {
    try {
      const consent = await prisma.consentRecord.findFirst({
        where: {
          dataSubjectId,
          purpose,
          consentGiven: true,
          withdrawalDate: null
        }
      });

      if (!consent) {
        throw new Error('No active consent found for this purpose');
      }

      // Update consent record
      await prisma.consentRecord.update({
        where: { id: consent.id },
        data: {
          consentGiven: false,
          withdrawalDate: new Date()
        }
      });

      // Log consent withdrawal
      await AuditLogger.logConsentEvent(
        dataSubjectId,
        'consent_withdrawn',
        purpose,
        ipAddress,
        userAgent
      );

      return true;
    } catch (error) {
      console.error('Failed to withdraw consent:', error);
      throw error;
    }
  }

  /**
   * Check if consent exists and is valid
   */
  static async hasValidConsent(
    dataSubjectId: string,
    purpose: string
  ): Promise<boolean> {
    const consent = await prisma.consentRecord.findFirst({
      where: {
        dataSubjectId,
        purpose,
        consentGiven: true,
        withdrawalDate: null
      }
    });

    return !!consent;
  }

  /**
   * Get all consents for a data subject
   */
  static async getDataSubjectConsents(dataSubjectId: string): Promise<ConsentResponse[]> {
    const consents = await prisma.consentRecord.findMany({
      where: { dataSubjectId },
      orderBy: { consentDate: 'desc' }
    });

    return consents.map(consent => ({
      consentId: consent.id,
      consentGiven: consent.consentGiven,
      consentDate: consent.consentDate,
      purposes: [consent.purpose],
      dataCategories: [], // Would need to be fetched from related data processing activity
      retentionPeriod: 0, // Would need to be fetched from related data processing activity
      withdrawalInstructions: 'You can withdraw consent at any time by contacting privacy@nogalss.org'
    }));
  }

  /**
   * Get consent history for a data subject
   */
  static async getConsentHistory(dataSubjectId: string) {
    return await prisma.consentRecord.findMany({
      where: { dataSubjectId },
      orderBy: { consentDate: 'desc' }
    });
  }

  /**
   * Update consent (for new purposes or data categories)
   */
  static async updateConsent(
    dataSubjectId: string,
    oldPurpose: string,
    newPurpose: string,
    ipAddress: string,
    userAgent: string
  ): Promise<ConsentResponse> {
    try {
      // Withdraw old consent
      await this.withdrawConsent(dataSubjectId, oldPurpose, ipAddress, userAgent);

      // Record new consent
      return await this.recordConsent({
        dataSubjectId,
        purpose: newPurpose,
        dataCategories: [], // Would be provided in real implementation
        legalBasis: 'consent',
        retentionPeriod: 365, // Would be provided in real implementation
        ipAddress,
        userAgent
      });
    } catch (error) {
      console.error('Failed to update consent:', error);
      throw error;
    }
  }

  /**
   * Generate consent form data
   */
  static generateConsentForm(purposes: string[], dataCategories: string[]): {
    title: string;
    description: string;
    purposes: string[];
    dataCategories: string[];
    legalBasis: string;
    retentionPeriod: string;
    dataSubjectRights: string[];
  } {
    return {
      title: 'Data Processing Consent',
      description: 'We need your consent to process your personal data for the following purposes:',
      purposes,
      dataCategories,
      legalBasis: 'Your consent is the legal basis for processing your personal data.',
      retentionPeriod: 'Your data will be retained for 7 years for financial records and 3 years for other data, or until you withdraw consent.',
      dataSubjectRights: [
        'Right to be informed about data processing',
        'Right of access to your personal data',
        'Right to rectification of inaccurate data',
        'Right to erasure of your data',
        'Right to data portability',
        'Right to object to processing',
        'Right to withdraw consent at any time'
      ]
    };
  }

  /**
   * Validate consent for data processing
   */
  static async validateConsentForProcessing(
    dataSubjectId: string,
    purpose: string,
    dataCategories: string[]
  ): Promise<{ valid: boolean; reason?: string }> {
    const hasConsent = await this.hasValidConsent(dataSubjectId, purpose);
    
    if (!hasConsent) {
      return {
        valid: false,
        reason: 'No valid consent found for this purpose'
      };
    }

    // Additional validation could be added here
    // e.g., checking if data categories are covered by consent

    return { valid: true };
  }

  /**
   * Get consent statistics
   */
  static async getConsentStatistics() {
    const totalConsents = await prisma.consentRecord.count();
    const activeConsents = await prisma.consentRecord.count({
      where: {
        consentGiven: true,
        withdrawalDate: null
      }
    });
    const withdrawnConsents = await prisma.consentRecord.count({
      where: {
        consentGiven: false,
        withdrawalDate: { not: null }
      }
    });

    return {
      totalConsents,
      activeConsents,
      withdrawnConsents,
      consentRate: totalConsents > 0 ? (activeConsents / totalConsents) * 100 : 0
    };
  }

  /**
   * Clean up expired consents
   */
  static async cleanupExpiredConsents() {
    // This would be called by a scheduled job
    // For now, just log the action
    console.log('Consent cleanup would be performed here');
  }

  /**
   * Generate consent withdrawal form
   */
  static generateWithdrawalForm(dataSubjectId: string): {
    title: string;
    description: string;
    instructions: string[];
    contactInfo: string;
  } {
    return {
      title: 'Withdraw Consent',
      description: 'You have the right to withdraw your consent at any time. Please note that withdrawing consent may affect our ability to provide certain services.',
      instructions: [
        'Contact us at privacy@nogalss.org',
        'Include your data subject ID in your request',
        'Specify which consents you wish to withdraw',
        'We will process your request within 30 days'
      ],
      contactInfo: 'privacy@nogalss.org'
    };
  }
}

