import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ResolveAccountSchema = z.object({
  bankCode: z.string().min(1, 'Bank code is required'),
  accountNumber: z.string().min(10, 'Account number must be at least 10 digits'),
});

/**
 * Bank Account Name Resolution API
 * 
 * This endpoint resolves bank account names using Paystack.
 * 
 * Required Environment Variables:
 * - PAYSTACK_SECRET_KEY: Your Paystack secret key
 * 
 * API Documentation: https://nubapi.com/docs
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bankCode, accountNumber } = ResolveAccountSchema.parse(body);

    // Fetch bank information from database
    const bank = await prisma.bank.findFirst({
      where: {
        code: bankCode
      }
    });

    if (!bank) {
      return NextResponse.json({
        success: false,
        error: 'Bank not found. Please select a valid bank.',
        bankSupported: false
      }, { status: 400 });
    }

    // Use the bank code from database
    const paystackBankCode = bank.code;
    const bankName = bank.name;
    
    console.log('🔍 Resolving account name for:', { 
      bankCode: bankCode, 
      paystackBankCode, 
      bankName,
      accountNumber
    });

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    const base = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';
    if (!paystackSecret) {
      return NextResponse.json({ success: false, error: 'PAYSTACK_SECRET_KEY not configured' }, { status: 500 });
    }

    const url = `${base}/bank/resolve?account_number=${accountNumber}&bank_code=${paystackBankCode}`;
    const psRes = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(7000),
    });

    const psData = await psRes.json().catch(() => ({} as any));
    if (!psRes.ok || psData.status === false) {
      const msg = psData.message || psRes.statusText || 'Unable to resolve account';
      return NextResponse.json({ success: false, error: msg, bankSupported: true, bankName }, { status: 400 });
    }

    const resolvedName = psData.data?.account_name || psData.account_name;
    const resolvedNumber = psData.data?.account_number || psData.account_number || accountNumber;
    return NextResponse.json({
      success: true,
      accountName: resolvedName || 'Account name not available',
      accountNumber: resolvedNumber,
      bankCode: paystackBankCode,
      bankName,
      bankSupported: true,
    });

  } catch (error: any) {
    console.error('❌ Account resolution error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      }, { status: 400 });
    }
    
    // Handle timeout and network errors
    if (error.name === 'AbortError' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Account verification service is taking too long to respond. Please enter your account name manually.',
        details: 'Service timeout',
        bankSupported: true,
        bankName: 'Unknown Bank',
        fallback: true
      }, { status: 504 });
    }
    // Handle network connectivity issues
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
      return NextResponse.json({
        success: false,
        error: 'Account verification service is temporarily unavailable. Please enter your account name manually.',
        details: 'Network connectivity issue',
        bankSupported: true,
        bankName: 'Unknown Bank',
        fallback: true
      }, { status: 503 });
    }

    return NextResponse.json({
      success: false,
      error: 'An error occurred while resolving account name. Please try again.',
      details: error.message || 'Unknown error',
      bankSupported: true,
      bankName: 'Unknown Bank'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
