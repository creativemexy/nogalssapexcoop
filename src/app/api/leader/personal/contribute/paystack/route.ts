import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { initializePayment } from '@/lib/paystack';
import { calculateTransactionFees } from '@/lib/fee-calculator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for impersonation data in request headers
    const impersonationData = request.headers.get('x-impersonation-data');
    let targetUserId = (session.user as any).id;
    let userRole = (session.user as any).role;

    // If impersonation data is provided, use that instead of session data
    if (impersonationData) {
      try {
        const impersonatedUser = JSON.parse(impersonationData);
        targetUserId = impersonatedUser.id;
        userRole = impersonatedUser.role;
      } catch (error) {
        console.error('Error parsing impersonation data:', error);
      }
    }

    if (userRole !== 'LEADER') {
      return NextResponse.json({ error: 'Access denied. Leader role required.' }, { status: 403 });
    }

    const { amount, description } = await request.json();

    if (!amount || amount < 1000) {
      return NextResponse.json({ error: 'Minimum contribution amount is ₦1,000' }, { status: 400 });
    }

    // Get the leader's cooperative ID
    const leader = await prisma.leader.findUnique({
      where: { userId: targetUserId },
      select: { cooperativeId: true }
    });

    if (!leader?.cooperativeId) {
      return NextResponse.json({ error: 'No cooperative associated with leader' }, { status: 400 });
    }

    // Calculate transaction fees using the utility function
    const feeCalculation = calculateTransactionFees(amount);
    
    console.log('💰 Fee calculation for leader contribution:', {
      baseAmount: feeCalculation.baseAmount,
      fee: feeCalculation.fee,
      totalAmount: feeCalculation.totalAmount
    });

    // Convert total amount (including fees) to kobo (Paystack uses kobo)
    const amountInKobo = Math.round(feeCalculation.totalAmount * 100);

    // Generate unique reference
    const reference = `LEADER_CONTRIB_${targetUserId}_${Date.now()}`;

    // Initialize Paystack payment
    const paymentData = {
      email: session.user.email || '',
      amount: amountInKobo,
      reference: reference,
      callback_url: `${process.env.NEXTAUTH_URL}/dashboard/leader/personal/contribute?type=contribution&reference=${reference}`,
      metadata: {
        userId: targetUserId,
        cooperativeId: leader.cooperativeId,
        type: 'leader_contribution',
        baseAmount: feeCalculation.baseAmount,
        fee: feeCalculation.fee,
        totalAmount: feeCalculation.totalAmount
      }
    };

    console.log('🚀 Initializing leader contribution payment:', paymentData);

    const paymentResponse = await initializePayment(paymentData);

    if (!paymentResponse.status) {
      console.error('❌ Paystack payment initialization failed:', paymentResponse);
      return NextResponse.json({
        error: 'Payment initialization failed',
        details: paymentResponse.message
      }, { status: 400 });
    }

    // Store pending contribution with base amount (not including fees)
    await prisma.contribution.create({
      data: {
        userId: targetUserId,
        cooperativeId: leader.cooperativeId,
        amount: Math.round(feeCalculation.baseAmount * 100), // Store base amount in kobo
        description: description || `Leader contribution of ₦${amount.toLocaleString()}`
      }
    });

    console.log('✅ Leader contribution payment initialized successfully');

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResponse.data.authorization_url,
      reference: reference,
      message: 'Payment initialized successfully'
    });

  } catch (error) {
    console.error('Error initializing leader contribution payment:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to initialize payment'
    }, { status: 500 });
  }
}
