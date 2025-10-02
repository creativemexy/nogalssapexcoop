/**
 * Calculate Paystack transaction fees for local channels
 * Rules:
 * - 1.5% + ₦100 for all local channels (including Direct Debit)
 * - Fee cap: ₦2,000 maximum
 * - Fee waiver: ₦100 fee is waived for transactions under ₦2,500
 */

export interface FeeCalculation {
  baseAmount: number;
  fee: number;
  totalAmount: number;
  feePercentage: number;
  isFeeWaived: boolean;
  isFeeCapped: boolean;
}

export function calculateTransactionFees(amount: number): FeeCalculation {
  const baseAmount = amount;
  let fee = 0;
  let isFeeWaived = false;
  let isFeeCapped = false;
  
  // 1.5% + ₦100 for all local channels
  const baseFee = (baseAmount * 0.015) + 100;
  
  // Check if fee should be waived (transactions under ₦2,500)
  if (baseAmount < 2500) {
    fee = Math.max(0, baseFee - 100);
    isFeeWaived = true;
  } else {
    fee = baseFee;
  }
  
  // Cap fees at ₦2,000
  if (fee > 2000) {
    fee = 2000;
    isFeeCapped = true;
  }
  
  // Round to 2 decimal places
  fee = Math.round(fee * 100) / 100;
  
  const totalAmount = baseAmount + fee;
  const feePercentage = baseAmount > 0 ? (fee / baseAmount) * 100 : 0;
  
  return {
    baseAmount,
    fee,
    totalAmount,
    feePercentage: Math.round(feePercentage * 100) / 100,
    isFeeWaived,
    isFeeCapped
  };
}

export function formatFeeBreakdown(calculation: FeeCalculation): string {
  const { baseAmount, fee, totalAmount, feePercentage, isFeeWaived, isFeeCapped } = calculation;
  
  let breakdown = `Base Amount: ₦${baseAmount.toLocaleString()}\n`;
  breakdown += `Transaction Fee: ₦${fee.toLocaleString()}`;
  
  if (isFeeWaived) {
    breakdown += ` (₦100 waived for amounts under ₦2,500)`;
  }
  
  if (isFeeCapped) {
    breakdown += ` (capped at ₦2,000)`;
  }
  
  breakdown += `\nTotal Amount: ₦${totalAmount.toLocaleString()}`;
  breakdown += `\nEffective Fee Rate: ${feePercentage}%`;
  
  return breakdown;
}
