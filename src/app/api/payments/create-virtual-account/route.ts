import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, accountType, accountName, email, phoneNumber } = body;

    // Validate required fields
    if (!userId || !accountType || !accountName || !email || !phoneNumber) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, accountType, accountName, email, phoneNumber' 
      }, { status: 400 });
    }

    // Create virtual account via Paystack
    const paystackResponse = await fetch('https://api.paystack.co/customer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        first_name: accountName.split(' ')[0] || accountName,
        last_name: accountName.split(' ').slice(1).join(' ') || '',
        phone: phoneNumber
      })
    });

    if (!paystackResponse.ok) {
      const error = await paystackResponse.json();
      return NextResponse.json({ 
        error: 'Failed to create virtual account with Paystack',
        details: error 
      }, { status: 500 });
    }

    const paystackData = await paystackResponse.json();

    // Create dedicated account for the customer
    const dedicatedAccountResponse = await fetch('https://api.paystack.co/dedicated_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: paystackData.data.customer_code,
        preferred_bank: 'wema-bank', // Default bank
        split_code: process.env.PAYSTACK_SPLIT_CODE // If you have a split code
      })
    });

    if (!dedicatedAccountResponse.ok) {
      const error = await dedicatedAccountResponse.json();
      return NextResponse.json({ 
        error: 'Failed to create dedicated account',
        details: error 
      }, { status: 500 });
    }

    const dedicatedAccountData = await dedicatedAccountResponse.json();

    // Store virtual account in database
    const virtualAccount = await prisma.virtualAccount.create({
      data: {
        userId,
        accountType,
        accountName,
        accountNumber: dedicatedAccountData.data.account_number,
        bankName: dedicatedAccountData.data.bank.name,
        bankCode: dedicatedAccountData.data.bank.bank_code,
        customerCode: paystackData.data.customer_code,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      virtualAccount: {
        id: virtualAccount.id,
        accountName: virtualAccount.accountName,
        accountNumber: virtualAccount.accountNumber,
        bankName: virtualAccount.bankName,
        accountType: virtualAccount.accountType,
        isActive: virtualAccount.isActive
      }
    });

  } catch (error) {
    console.error('Error creating virtual account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


