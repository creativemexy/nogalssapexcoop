import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const ResolveAccountSchema = z.object({
  bankCode: z.string().min(1, 'Bank code is required'),
  accountNumber: z.string().min(10, 'Account number must be at least 10 digits'),
});

/**
 * Bank Account Name Resolution API
 * 
 * This endpoint resolves bank account names using NubAPI.
 * 
 * Required Environment Variables:
 * - NUBAPI_KEY: Your NubAPI authentication key
 * 
 * API Documentation: https://nubapi.com/api/verify
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bankCode, accountNumber } = ResolveAccountSchema.parse(body);

    // Normalize bank code (trim whitespace, ensure consistent format)
    const normalizedBankCode = bankCode.trim();
    
    // Fetch bank information from database
    // Try multiple lookup strategies
    let bank = await prisma.bank.findFirst({
      where: {
        code: normalizedBankCode
      }
    });

    // If not found by code, try paystackCode field (may contain alternate code format)
    if (!bank) {
      bank = await prisma.bank.findFirst({
        where: {
          paystackCode: normalizedBankCode
        }
      });
    }

    // If still not found, try with padded zeros (in case code is stored as "4" instead of "000004")
    if (!bank && normalizedBankCode.startsWith('00000')) {
      const shortCode = normalizedBankCode.replace(/^0+/, '');
      if (shortCode !== normalizedBankCode) {
        bank = await prisma.bank.findFirst({
          where: {
            OR: [
              { code: shortCode },
              { paystackCode: shortCode }
            ]
          }
        });
      }
    }

    if (!bank) {
      console.error('❌ Bank not found for code:', normalizedBankCode);
      // Log available banks for debugging (first 5 only)
      const sampleBanks = await prisma.bank.findMany({
        take: 5,
        select: { name: true, code: true, paystackCode: true }
      });
      console.log('📋 Sample banks in database:', sampleBanks);
      
      return NextResponse.json({
        success: false,
        error: `Bank not found for code: ${normalizedBankCode}. Please select a valid bank.`,
        bankSupported: false,
        searchedCode: normalizedBankCode
      }, { status: 400 });
    }

    // Use the bank code from database for NubAPI
    const nubapiBankCode = bank.code;
    const bankName = bank.name;
    
    console.log('🔍 Resolving account name for:', { 
      requestedBankCode: bankCode,
      normalizedBankCode: normalizedBankCode,
      databaseBankCode: bank.code,
      nubapiBankCode, 
      bankName,
      accountNumber
    });

    const nubapiKey = process.env.NUBAPI_KEY;
    const base = process.env.NUBAPI_BASE_URL || 'https://nubapi.com';
    if (!nubapiKey) {
      return NextResponse.json({ success: false, error: 'NUBAPI_KEY not configured' }, { status: 500 });
    }

    // Use NubAPI endpoint: https://nubapi.com/api/verify
    const url = `${base}/api/verify?account_number=${accountNumber}&bank_code=${nubapiBankCode}`;
    const nubapiRes = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${nubapiKey}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(7000),
    });

    const nubapiData = await nubapiRes.json().catch(() => ({} as any));
    if (!nubapiRes.ok || nubapiData.status === false) {
      const msg = nubapiData.message || nubapiRes.statusText || 'Unable to resolve account';
      return NextResponse.json({ success: false, error: msg, bankSupported: true, bankName }, { status: 400 });
    }

    // NubAPI response format may vary, handle both possible structures
    const resolvedName = nubapiData.data?.account_name || nubapiData.account_name || nubapiData.name;
    const resolvedNumber = nubapiData.data?.account_number || nubapiData.account_number || accountNumber;
    return NextResponse.json({
      success: true,
      accountName: resolvedName || 'Account name not available',
      accountNumber: resolvedNumber,
      bankCode: nubapiBankCode,
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
  }
}
