/**
 * Data Retention Management for NDPA Compliance
 * Handles data retention policies and automatic data cleanup
 */

import { prisma } from '@/lib/prisma';
import { AuditLogger } from './audit-logger';
import { DataEncryption } from './data-encryption';

export interface RetentionPolicy {
  dataCategory: string;
  retentionPeriod: number; // in days
  legalBasis: string;
  description: string;
  isActive: boolean;
}

export interface DataRetentionAction {
  id: string;
  action: 'anonymize' | 'delete' | 'archive';
  resource: string;
  resourceId: string;
  reason: string;
  executedAt: Date;
}

export class DataRetentionManager {
  /**
   * Create or update data retention policy
   */
  static async createRetentionPolicy(
    policy: Omit<RetentionPolicy, 'isActive'>,
    createdBy: string
  ) {
    return await prisma.dataRetentionPolicy.create({
      data: {
        dataCategory: policy.dataCategory,
        retentionPeriod: policy.retentionPeriod,
        legalBasis: policy.legalBasis,
        description: policy.description,
        isActive: true,
        createdBy
      }
    });
  }

  /**
   * Get all active retention policies
   */
  static async getActiveRetentionPolicies() {
    return await prisma.dataRetentionPolicy.findMany({
      where: { isActive: true },
      orderBy: { dataCategory: 'asc' }
    });
  }

  /**
   * Check if data should be retained
   */
  static async shouldRetainData(
    dataCategory: string,
    createdAt: Date
  ): Promise<{ retain: boolean; reason?: string }> {
    const policy = await prisma.dataRetentionPolicy.findFirst({
      where: {
        dataCategory,
        isActive: true
      }
    });

    if (!policy) {
      return { retain: true, reason: 'No retention policy found' };
    }

    const now = new Date();
    const expirationDate = new Date(createdAt.getTime() + (policy.retentionPeriod * 24 * 60 * 60 * 1000));
    
    if (now > expirationDate) {
      return { retain: false, reason: `Retention period expired (${policy.retentionPeriod} days)` };
    }

    return { retain: true };
  }

  /**
   * Process data retention for expired records
   */
  static async processExpiredData() {
    const policies = await this.getActiveRetentionPolicies();
    const actions: DataRetentionAction[] = [];

    for (const policy of policies) {
      const expiredRecords = await this.findExpiredRecords(policy);
      
      for (const record of expiredRecords) {
        const action = await this.processExpiredRecord(record, policy);
        if (action) {
          actions.push(action);
        }
      }
    }

    return actions;
  }

  /**
   * Find expired records for a policy
   */
  private static async findExpiredRecords(policy: RetentionPolicy) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod);

    // This would need to be customized based on your data models
    // For now, we'll return a generic structure
    return [];
  }

  /**
   * Process a single expired record
   */
  private static async processExpiredRecord(
    record: any,
    policy: RetentionPolicy
  ): Promise<DataRetentionAction | null> {
    try {
      // Determine action based on policy and data sensitivity
      const action = this.determineRetentionAction(record, policy);
      
      if (action === 'anonymize') {
        await this.anonymizeRecord(record);
      } else if (action === 'delete') {
        await this.deleteRecord(record);
      } else if (action === 'archive') {
        await this.archiveRecord(record);
      }

      const retentionAction: DataRetentionAction = {
        id: `retention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        resource: record.resource || 'unknown',
        resourceId: record.id || 'unknown',
        reason: `Retention period expired (${policy.retentionPeriod} days)`,
        executedAt: new Date()
      };

      // Log the retention action
      const auditAction = action === 'delete' ? 'data_deleted' : 
                         action === 'anonymize' ? 'data_anonymized' : 
                         'retention_expired';
      
      await AuditLogger.logDataRetention(
        record.resource || 'unknown',
        record.id || 'unknown',
        auditAction,
        policy.retentionPeriod,
        'system',
        'system'
      );

      return retentionAction;
    } catch (error) {
      console.error('Failed to process expired record:', error);
      return null;
    }
  }

  /**
   * Determine retention action based on data sensitivity
   */
  private static determineRetentionAction(record: any, policy: RetentionPolicy): 'anonymize' | 'delete' | 'archive' {
    // High sensitivity data should be anonymized rather than deleted
    const highSensitivityFields = ['nin', 'bankAccount', 'financial'];
    const hasHighSensitivity = highSensitivityFields.some(field => 
      JSON.stringify(record).toLowerCase().includes(field)
    );

    if (hasHighSensitivity) {
      return 'anonymize';
    }

    // Legal requirements might require archiving
    if (policy.legalBasis.includes('legal_obligation')) {
      return 'archive';
    }

    // Default to deletion for low sensitivity data
    return 'delete';
  }

  /**
   * Anonymize record data
   */
  private static async anonymizeRecord(record: any) {
    const anonymizedData = DataEncryption.anonymize(record);
    
    // Update the record with anonymized data
    // This would need to be customized based on your data models
    console.log('Anonymizing record:', record.id, anonymizedData);
  }

  /**
   * Delete record
   */
  private static async deleteRecord(record: any) {
    // Delete the record
    // This would need to be customized based on your data models
    console.log('Deleting record:', record.id);
  }

  /**
   * Archive record
   */
  private static async archiveRecord(record: any) {
    // Archive the record
    // This would need to be customized based on your data models
    console.log('Archiving record:', record.id);
  }

  /**
   * Get retention statistics
   */
  static async getRetentionStatistics() {
    const policies = await this.getActiveRetentionPolicies();
    const stats = {
      totalPolicies: policies.length,
      averageRetentionPeriod: 0,
      categories: policies.map(p => p.dataCategory),
      retentionPeriods: policies.map(p => p.retentionPeriod)
    };

    if (policies.length > 0) {
      stats.averageRetentionPeriod = policies.reduce((sum, p) => sum + p.retentionPeriod, 0) / policies.length;
    }

    return stats;
  }

  /**
   * Update retention policy
   */
  static async updateRetentionPolicy(
    policyId: string,
    updates: Partial<RetentionPolicy>,
    updatedBy: string
  ) {
    return await prisma.dataRetentionPolicy.update({
      where: { id: policyId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Deactivate retention policy
   */
  static async deactivateRetentionPolicy(policyId: string, deactivatedBy: string) {
    return await prisma.dataRetentionPolicy.update({
      where: { id: policyId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Get data retention report
   */
  static async generateRetentionReport() {
    const policies = await this.getActiveRetentionPolicies();
    const stats = await this.getRetentionStatistics();
    
    return {
      reportDate: new Date(),
      policies,
      statistics: stats,
      complianceStatus: this.assessComplianceStatus(policies),
      recommendations: this.generateRecommendations(policies)
    };
  }

  /**
   * Assess compliance status
   */
  private static assessComplianceStatus(policies: RetentionPolicy[]) {
    const requiredCategories = ['financial', 'personal', 'transaction', 'communication'];
    const coveredCategories = policies.map(p => p.dataCategory);
    const missingCategories = requiredCategories.filter(cat => !coveredCategories.includes(cat));

    return {
      compliant: missingCategories.length === 0,
      missingCategories,
      coverage: (coveredCategories.length / requiredCategories.length) * 100
    };
  }

  /**
   * Generate recommendations
   */
  private static generateRecommendations(policies: RetentionPolicy[]) {
    const recommendations = [];

    // Check for missing categories
    const requiredCategories = ['financial', 'personal', 'transaction', 'communication'];
    const coveredCategories = policies.map(p => p.dataCategory);
    const missingCategories = requiredCategories.filter(cat => !coveredCategories.includes(cat));

    if (missingCategories.length > 0) {
      recommendations.push({
        type: 'missing_policy',
        message: `Create retention policies for: ${missingCategories.join(', ')}`,
        priority: 'high'
      });
    }

    // Check for very long retention periods
    const longRetentionPolicies = policies.filter(p => p.retentionPeriod > 365 * 7); // 7 years
    if (longRetentionPolicies.length > 0) {
      recommendations.push({
        type: 'long_retention',
        message: 'Review retention periods for compliance with data minimization principle',
        priority: 'medium'
      });
    }

    // Check for very short retention periods
    const shortRetentionPolicies = policies.filter(p => p.retentionPeriod < 30);
    if (shortRetentionPolicies.length > 0) {
      recommendations.push({
        type: 'short_retention',
        message: 'Ensure retention periods meet legal requirements',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Schedule retention processing
   */
  static async scheduleRetentionProcessing() {
    // This would typically be called by a cron job or scheduled task
    console.log('Starting scheduled retention processing...');
    
    try {
      const actions = await this.processExpiredData();
      console.log(`Processed ${actions.length} retention actions`);
      return actions;
    } catch (error) {
      console.error('Retention processing failed:', error);
      throw error;
    }
  }
}
