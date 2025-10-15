/**
 * Comprehensive Audit Logging for NDPA Compliance
 * Tracks all data processing activities and user actions
 */

import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress: string;
  userAgent: string;
  dataProcessingActivityId?: string;
}

export interface DataProcessingContext {
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  retentionPeriod: number;
}

export class AuditLogger {
  /**
   * Log user authentication events
   */
  static async logAuthentication(
    userId: string,
    action: 'login' | 'logout' | 'failed_login' | 'password_reset',
    ipAddress: string,
    userAgent: string,
    additionalData?: any
  ) {
    await this.createLog({
      userId,
      action,
      resource: 'authentication',
      oldValues: null,
      newValues: additionalData,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log data access events
   */
  static async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'read' | 'export' | 'download',
    ipAddress: string,
    userAgent: string,
    dataCategories: string[]
  ) {
    await this.createLog({
      userId,
      action,
      resource,
      resourceId,
      newValues: { dataCategories, accessType: action },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log data modification events
   */
  static async logDataModification(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'create' | 'update' | 'delete',
    oldValues: any,
    newValues: any,
    ipAddress: string,
    userAgent: string
  ) {
    await this.createLog({
      userId,
      action,
      resource,
      resourceId,
      oldValues,
      newValues,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log consent management events
   */
  static async logConsentEvent(
    dataSubjectId: string,
    action: 'consent_given' | 'consent_withdrawn' | 'consent_updated',
    purpose: string,
    ipAddress: string,
    userAgent: string,
    consentVersion: string = '1.0'
  ) {
    await this.createLog({
      userId: dataSubjectId,
      action,
      resource: 'consent',
      newValues: { purpose, consentVersion },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log data subject rights requests
   */
  static async logDataSubjectRequest(
    dataSubjectId: string,
    requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'objection',
    description: string,
    ipAddress: string,
    userAgent: string
  ) {
    await this.createLog({
      userId: dataSubjectId,
      action: `data_subject_request_${requestType}`,
      resource: 'data_subject_rights',
      newValues: { requestType, description },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log data breach events
   */
  static async logDataBreach(
    breachId: string,
    description: string,
    categories: string[],
    approximateDataSubjects: number,
    reportedBy: string,
    ipAddress: string,
    userAgent: string
  ) {
    await this.createLog({
      userId: reportedBy,
      action: 'data_breach_reported',
      resource: 'data_breach',
      resourceId: breachId,
      newValues: {
        description,
        categories,
        approximateDataSubjects
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log data retention events
   */
  static async logDataRetention(
    resource: string,
    resourceId: string,
    action: 'retention_expired' | 'data_anonymized' | 'data_deleted',
    retentionPeriod: number,
    ipAddress: string,
    userAgent: string
  ) {
    await this.createLog({
      action,
      resource,
      resourceId,
      newValues: { retentionPeriod, action },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log system configuration changes
   */
  static async logSystemConfiguration(
    userId: string,
    setting: string,
    oldValue: any,
    newValue: any,
    ipAddress: string,
    userAgent: string
  ) {
    await this.createLog({
      userId,
      action: 'system_configuration_changed',
      resource: 'system_settings',
      resourceId: setting,
      oldValues: { [setting]: oldValue },
      newValues: { [setting]: newValue },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log data processing activities
   */
  static async logDataProcessing(
    activityId: string,
    action: string,
    context: DataProcessingContext,
    ipAddress: string,
    userAgent: string
  ) {
    await this.createLog({
      action,
      resource: 'data_processing',
      resourceId: activityId,
      newValues: context,
      ipAddress,
      userAgent,
      dataProcessingActivityId: activityId
    });
  }

  /**
   * Extract request information for logging
   */
  static extractRequestInfo(request: NextRequest): { ipAddress: string; userAgent: string } {
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    return { ipAddress, userAgent };
  }

  /**
   * Create audit log entry
   */
  private static async createLog(entry: AuditLogEntry) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          oldValues: entry.oldValues,
          newValues: entry.newValues,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          dataProcessingActivityId: entry.dataProcessingActivityId,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditLogs(userId: string, limit: number = 100) {
    return await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  /**
   * Get audit logs for a specific resource
   */
  static async getResourceAuditLogs(resource: string, resourceId?: string, limit: number = 100) {
    return await prisma.auditLog.findMany({
      where: {
        resource,
        ...(resourceId && { resourceId })
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  /**
   * Get audit logs for data processing activities
   */
  static async getDataProcessingAuditLogs(activityId: string, limit: number = 100) {
    return await prisma.auditLog.findMany({
      where: { dataProcessingActivityId: activityId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  /**
   * Search audit logs
   */
  static async searchAuditLogs(
    filters: {
      userId?: string;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 100
  ) {
    return await prisma.auditLog.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.action && { action: { contains: filters.action } }),
        ...(filters.resource && { resource: { contains: filters.resource } }),
        ...(filters.startDate && { timestamp: { gte: filters.startDate } }),
        ...(filters.endDate && { timestamp: { lte: filters.endDate } })
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  /**
   * Generate audit report
   */
  static async generateAuditReport(
    startDate: Date,
    endDate: Date,
    userId?: string
  ) {
    const logs = await prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        ...(userId && { userId })
      },
      orderBy: { timestamp: 'desc' }
    });

    // Group by action type
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by resource type
    const resourceCounts = logs.reduce((acc, log) => {
      acc[log.resource] = (acc[log.resource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLogs: logs.length,
      dateRange: { startDate, endDate },
      actionCounts,
      resourceCounts,
      logs: logs.slice(0, 100) // Return first 100 logs
    };
  }
}

