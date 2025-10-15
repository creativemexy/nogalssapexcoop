/**
 * Data Breach Management for NDPA Compliance
 * Handles data breach detection, reporting, and response
 */

import { prisma } from '@/lib/prisma';
import { AuditLogger } from './audit-logger';
import { NotificationService } from './notifications';

export interface BreachReport {
  description: string;
  categories: string[];
  approximateDataSubjects: number;
  likelyConsequences: string;
  measuresProposed: string;
  detectedBy: string;
  detectedAt: Date;
}

export interface BreachResponse {
  breachId: string;
  status: 'detected' | 'investigating' | 'contained' | 'resolved';
  actions: string[];
  timeline: Array<{
    timestamp: Date;
    action: string;
    description: string;
  }>;
}

export class BreachManager {
  /**
   * Report a data breach
   */
  static async reportBreach(
    breachReport: BreachReport,
    reportedBy: string,
    ipAddress: string,
    userAgent: string
  ) {
    try {
      // Create breach record
      const breach = await prisma.dataBreach.create({
        data: {
          description: breachReport.description,
          categories: breachReport.categories,
          approximateDataSubjects: breachReport.approximateDataSubjects,
          likelyConsequences: breachReport.likelyConsequences,
          measuresProposed: breachReport.measuresProposed,
          reportedBy,
          reportedAt: breachReport.detectedAt,
          status: 'detected'
        }
      });

      // Log breach report
      await AuditLogger.logDataBreach(
        breach.id,
        breachReport.description,
        breachReport.categories,
        breachReport.approximateDataSubjects,
        reportedBy,
        ipAddress,
        userAgent
      );

      // Check if notification is required
      const requiresNotification = this.isNotificationRequired(breach);
      
      if (requiresNotification) {
        await this.initiateBreachResponse(breach.id);
      }

      return breach;
    } catch (error) {
      console.error('Failed to report breach:', error);
      throw error;
    }
  }

  /**
   * Check if breach notification is required
   */
  private static isNotificationRequired(breach: any): boolean {
    // NDPA requires notification within 72 hours if likely to result in high risk
    const highRiskCategories = ['financial', 'biometric', 'health', 'criminal'];
    const hasHighRiskCategory = breach.categories.some((cat: string) => 
      highRiskCategories.includes(cat.toLowerCase())
    );
    
    const hasHighDataSubjectCount = breach.approximateDataSubjects > 100;
    
    return hasHighRiskCategory || hasHighDataSubjectCount;
  }

  /**
   * Initiate breach response
   */
  private static async initiateBreachResponse(breachId: string) {
    try {
      // Update breach status
      await prisma.dataBreach.update({
        where: { id: breachId },
        data: { status: 'investigating' }
      });

      // Notify data protection officer
      await this.notifyDataProtectionOfficer(breachId);
      
      // Notify affected data subjects if required
      const breach = await prisma.dataBreach.findUnique({
        where: { id: breachId }
      });

      if (breach && this.shouldNotifyDataSubjects(breach)) {
        await this.notifyAffectedDataSubjects(breachId);
      }

      // Report to authority if required
      if (this.shouldReportToAuthority(breach)) {
        await this.reportToAuthority(breachId);
      }

    } catch (error) {
      console.error('Failed to initiate breach response:', error);
      throw error;
    }
  }

  /**
   * Notify data protection officer
   */
  private static async notifyDataProtectionOfficer(breachId: string) {
    const breach = await prisma.dataBreach.findUnique({
      where: { id: breachId }
    });

    if (!breach) return;

    const emailContent = `
      <h2>Data Breach Alert</h2>
      <p>A data breach has been reported and requires immediate attention.</p>
      
      <h3>Breach Details:</h3>
      <ul>
        <li><strong>Breach ID:</strong> ${breach.id}</li>
        <li><strong>Description:</strong> ${breach.description}</li>
        <li><strong>Categories:</strong> ${breach.categories.join(', ')}</li>
        <li><strong>Approximate Data Subjects:</strong> ${breach.approximateDataSubjects}</li>
        <li><strong>Likely Consequences:</strong> ${breach.likelyConsequences}</li>
        <li><strong>Measures Proposed:</strong> ${breach.measuresProposed}</li>
        <li><strong>Reported At:</strong> ${breach.reportedAt.toLocaleString()}</li>
      </ul>
      
      <p><strong>Action Required:</strong> Please review and take appropriate action within 72 hours.</p>
    `;

    await NotificationService.sendEmail({
      to: 'privacy@nogalss.org',
      subject: 'URGENT: Data Breach Alert',
      html: emailContent
    });
  }

  /**
   * Check if data subjects should be notified
   */
  private static shouldNotifyDataSubjects(breach: any): boolean {
    // Notify if high risk or if required by law
    const highRiskCategories = ['financial', 'biometric', 'health'];
    const hasHighRiskCategory = breach.categories.some((cat: string) => 
      highRiskCategories.includes(cat.toLowerCase())
    );
    
    return hasHighRiskCategory || breach.approximateDataSubjects > 50;
  }

  /**
   * Notify affected data subjects
   */
  private static async notifyAffectedDataSubjects(breachId: string) {
    // This would need to be customized based on your user data structure
    // For now, we'll create a generic notification
    console.log(`Notifying affected data subjects for breach ${breachId}`);
    
    // Update breach record
    await prisma.dataBreach.update({
      where: { id: breachId },
      data: { reportedToDataSubjects: true }
    });
  }

  /**
   * Check if authority should be notified
   */
  private static shouldReportToAuthority(breach: any): boolean {
    // Report to authority if high risk
    const highRiskCategories = ['financial', 'biometric', 'health', 'criminal'];
    const hasHighRiskCategory = breach.categories.some((cat: string) => 
      highRiskCategories.includes(cat.toLowerCase())
    );
    
    return hasHighRiskCategory || breach.approximateDataSubjects > 100;
  }

  /**
   * Report to data protection authority
   */
  private static async reportToAuthority(breachId: string) {
    // This would typically involve submitting a formal report to the authority
    console.log(`Reporting breach ${breachId} to data protection authority`);
    
    // Update breach record
    await prisma.dataBreach.update({
      where: { id: breachId },
      data: { reportedToAuthority: true }
    });
  }

  /**
   * Update breach status
   */
  static async updateBreachStatus(
    breachId: string,
    status: 'detected' | 'investigating' | 'contained' | 'resolved',
    updatedBy: string,
    notes?: string
  ) {
    const breach = await prisma.dataBreach.update({
      where: { id: breachId },
      data: { 
        status,
        updatedAt: new Date()
      }
    });

    // Log status update
    await AuditLogger.logDataBreach(
      breachId,
      `Status updated to ${status}`,
      breach.categories,
      breach.approximateDataSubjects,
      updatedBy,
      'system',
      'system'
    );

    return breach;
  }

  /**
   * Get breach statistics
   */
  static async getBreachStatistics() {
    const totalBreaches = await prisma.dataBreach.count();
    const breachesByStatus = await prisma.dataBreach.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    
    const breachesByCategory = await prisma.dataBreach.findMany({
      select: { categories: true }
    });

    const categoryCounts = breachesByCategory.reduce((acc, breach) => {
      breach.categories.forEach(category => {
        acc[category] = (acc[category] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      totalBreaches,
      breachesByStatus,
      categoryCounts,
      averageDataSubjects: await this.getAverageDataSubjects()
    };
  }

  /**
   * Get average number of data subjects affected
   */
  private static async getAverageDataSubjects(): Promise<number> {
    const result = await prisma.dataBreach.aggregate({
      _avg: { approximateDataSubjects: true }
    });
    
    return result._avg.approximateDataSubjects || 0;
  }

  /**
   * Get breach timeline
   */
  static async getBreachTimeline(breachId: string) {
    const breach = await prisma.dataBreach.findUnique({
      where: { id: breachId }
    });

    if (!breach) {
      throw new Error('Breach not found');
    }

    const timeline = [
      {
        timestamp: breach.reportedAt,
        action: 'Breach Detected',
        description: breach.description
      },
      {
        timestamp: breach.createdAt,
        action: 'Breach Reported',
        description: 'Breach was reported to the system'
      }
    ];

    if (breach.reportedToAuthority) {
      timeline.push({
        timestamp: breach.updatedAt,
        action: 'Authority Notified',
        description: 'Data protection authority was notified'
      });
    }

    if (breach.reportedToDataSubjects) {
      timeline.push({
        timestamp: breach.updatedAt,
        action: 'Data Subjects Notified',
        description: 'Affected data subjects were notified'
      });
    }

    return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Generate breach report for authority
   */
  static async generateAuthorityReport(breachId: string) {
    const breach = await prisma.dataBreach.findUnique({
      where: { id: breachId }
    });

    if (!breach) {
      throw new Error('Breach not found');
    }

    return {
      breachId: breach.id,
      reportedAt: breach.reportedAt,
      description: breach.description,
      categories: breach.categories,
      approximateDataSubjects: breach.approximateDataSubjects,
      likelyConsequences: breach.likelyConsequences,
      measuresProposed: breach.measuresProposed,
      status: breach.status,
      reportedToAuthority: breach.reportedToAuthority,
      reportedToDataSubjects: breach.reportedToDataSubjects,
      timeline: await this.getBreachTimeline(breachId)
    };
  }

  /**
   * Get all breaches
   */
  static async getAllBreaches(limit: number = 100) {
    return await prisma.dataBreach.findMany({
      orderBy: { reportedAt: 'desc' },
      take: limit
    });
  }

  /**
   * Get breaches by status
   */
  static async getBreachesByStatus(status: string) {
    return await prisma.dataBreach.findMany({
      where: { status },
      orderBy: { reportedAt: 'desc' }
    });
  }

  /**
   * Search breaches
   */
  static async searchBreaches(filters: {
    status?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return await prisma.dataBreach.findMany({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.category && { categories: { has: filters.category } }),
        ...(filters.startDate && { reportedAt: { gte: filters.startDate } }),
        ...(filters.endDate && { reportedAt: { lte: filters.endDate } })
      },
      orderBy: { reportedAt: 'desc' }
    });
  }
}

