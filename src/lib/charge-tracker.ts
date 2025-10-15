/**
 * Charge Tracking Service
 * Records charges without applying them to payments
 */

import { prisma } from '@/lib/prisma';
import { calculateTransactionFees } from '@/lib/fee-calculator';

export interface ChargeRecordData {
  userId: string;
  cooperativeId?: string;
  businessId?: string;
  baseAmount: number;
  paymentType: string;
  paymentMethod: string;
  description?: string;
  metadata?: any;
}

export class ChargeTracker {
  /**
   * Record a charge without applying it to the payment
   */
  static async recordCharge(data: ChargeRecordData): Promise<void> {
    try {
      // Calculate what the charge would have been
      const feeCalculation = calculateTransactionFees(data.baseAmount);
      
      // Record the charge in the database
      await prisma.chargeRecord.create({
        data: {
          userId: data.userId,
          cooperativeId: data.cooperativeId,
          businessId: data.businessId,
          chargeType: 'transaction_fee',
          baseAmount: feeCalculation.baseAmount,
          chargeAmount: feeCalculation.fee,
          chargePercentage: feeCalculation.feePercentage,
          totalAmount: feeCalculation.totalAmount,
          paymentType: data.paymentType,
          paymentMethod: data.paymentMethod,
          status: 'recorded',
          description: data.description || `Transaction fee for ${data.paymentType}`,
          metadata: {
            ...data.metadata,
            feeCalculation: {
              isFeeWaived: feeCalculation.isFeeWaived,
              isFeeCapped: feeCalculation.isFeeCapped,
              originalCalculation: feeCalculation
            }
          }
        }
      });

      console.log(`💰 Charge recorded: ${feeCalculation.fee} for ${data.paymentType} (Base: ${data.baseAmount})`);
    } catch (error) {
      console.error('Error recording charge:', error);
      // Don't throw error to avoid breaking the payment flow
    }
  }

  /**
   * Get charge statistics for a user
   */
  static async getUserChargeStats(userId: string, startDate?: Date, endDate?: Date) {
    const whereClause: any = { userId };
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const charges = await prisma.chargeRecord.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    const totalCharges = charges.reduce((sum, charge) => sum + charge.chargeAmount, 0);
    const totalBaseAmount = charges.reduce((sum, charge) => sum + charge.baseAmount, 0);

    return {
      totalCharges,
      totalBaseAmount,
      chargeCount: charges.length,
      charges,
      averageChargePercentage: charges.length > 0 
        ? charges.reduce((sum, charge) => sum + charge.chargePercentage, 0) / charges.length 
        : 0
    };
  }

  /**
   * Get charge statistics for a cooperative
   */
  static async getCooperativeChargeStats(cooperativeId: string, startDate?: Date, endDate?: Date) {
    const whereClause: any = { cooperativeId };
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const charges = await prisma.chargeRecord.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalCharges = charges.reduce((sum, charge) => sum + charge.chargeAmount, 0);
    const totalBaseAmount = charges.reduce((sum, charge) => sum + charge.baseAmount, 0);

    return {
      totalCharges,
      totalBaseAmount,
      chargeCount: charges.length,
      charges,
      averageChargePercentage: charges.length > 0 
        ? charges.reduce((sum, charge) => sum + charge.chargePercentage, 0) / charges.length 
        : 0
    };
  }

  /**
   * Get system-wide charge statistics
   */
  static async getSystemChargeStats(startDate?: Date, endDate?: Date) {
    const whereClause: any = {};
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const charges = await prisma.chargeRecord.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        cooperative: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalCharges = charges.reduce((sum, charge) => sum + charge.chargeAmount, 0);
    const totalBaseAmount = charges.reduce((sum, charge) => sum + charge.baseAmount, 0);

    // Group by payment type
    const chargesByType = charges.reduce((acc, charge) => {
      if (!acc[charge.paymentType]) {
        acc[charge.paymentType] = {
          count: 0,
          totalCharges: 0,
          totalBaseAmount: 0
        };
      }
      acc[charge.paymentType].count++;
      acc[charge.paymentType].totalCharges += charge.chargeAmount;
      acc[charge.paymentType].totalBaseAmount += charge.baseAmount;
      return acc;
    }, {} as Record<string, { count: number; totalCharges: number; totalBaseAmount: number }>);

    return {
      totalCharges,
      totalBaseAmount,
      chargeCount: charges.length,
      charges,
      chargesByType,
      averageChargePercentage: charges.length > 0 
        ? charges.reduce((sum, charge) => sum + charge.chargePercentage, 0) / charges.length 
        : 0
    };
  }
}

