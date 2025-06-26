import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, email, type, description, cooperativeId, businessId } = await request.json();

    if (!amount || !email || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        cooperativeId: cooperativeId || null,
        businessId: businessId || null,
        type,
        amount: parseFloat(amount),
        description: description || `${type} payment`,
        reference: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'PENDING'
      }
    });

    // Initialize Paystack payment
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(parseFloat(amount) * 100), // Convert to kobo
        email,
        reference: transaction.reference,
        callback_url: `${process.env.NEXTAUTH_URL}/api/payments/verify`,
        metadata: {
          transaction_id: transaction.id,
          user_id: session.user.id,
          type,
          cooperative_id: cooperativeId,
          business_id: businessId
        }
      })
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok) {
      // Update transaction status to failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' }
      });

      return NextResponse.json({ error: 'Payment initialization failed' }, { status: 400 });
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        transactionId: transaction.id,
        userId: session.user.id,
        cooperativeId: cooperativeId || null,
        businessId: businessId || null,
        amount: parseFloat(amount),
        paystackReference: paystackData.data.reference,
        paystackAccessCode: paystackData.data.access_code,
        status: 'PENDING',
        metadata: paystackData.data
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference
      }
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 