import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, checkDatabaseConnection } from '@/lib/database';
import { initializePayment } from '@/lib/paystack';

export async function POST(request: NextRequest) {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ 
          error: 'Database connection unavailable',
          message: 'Please try again later'
        }, { status: 503 });
      }
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { amount, cooperativeId } = await request.json();

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!cooperativeId) {
      return NextResponse.json({ error: 'Cooperative ID is required' }, { status: 400 });
    }

    // Get user information to check their cooperative membership
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { cooperative: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is a member and if they're trying to contribute to their own cooperative
    if (!user.cooperativeId || user.cooperativeId !== cooperativeId) {
      return NextResponse.json({ 
        error: 'You can only contribute to your own cooperative',
        message: `You are a member of ${user.cooperative?.name || 'your cooperative'}. Please select your cooperative to make a contribution.`
      }, { status: 403 });
    }

    // Get cooperative information
    const cooperative = await prisma.cooperative.findUnique({
      where: { id: cooperativeId }
    });

    if (!cooperative) {
      return NextResponse.json({ error: 'Cooperative not found' }, { status: 404 });
    }

    // Convert amount to kobo (Paystack uses kobo)
    const amountInKobo = Math.round(amount * 100);

    // Generate unique reference
    const reference = `CONTRIB_${userId}_${Date.now()}`;

    // Initialize Paystack payment
    const paymentData = {
      email: session.user.email || '',
      amount: amountInKobo,
      reference: reference,
      callback_url: `${process.env.NEXTAUTH_URL}/payments/success?type=contribution`,
      metadata: {
        userId: userId,
        cooperativeId: cooperativeId,
        type: 'contribution',
        amount: amount
      }
    };

    console.log('🚀 Initializing contribution payment:', paymentData);

    const paymentResponse = await initializePayment(paymentData);

    if (!paymentResponse.status) {
      console.error('❌ Paystack payment initialization failed:', paymentResponse);
      return NextResponse.json({ 
        error: 'Payment initialization failed',
        details: paymentResponse.message 
      }, { status: 400 });
    }

    // Store pending contribution
    await prisma.pendingContribution.create({
      data: {
        userId: userId,
        cooperativeId: cooperativeId,
        amount: amountInKobo,
        reference: reference,
        status: 'PENDING'
      }
    });

    console.log('✅ Contribution payment initialized successfully');

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResponse.data.authorization_url,
      reference: reference,
      message: 'Payment initialized successfully'
    });

  } catch (error) {
    console.error('Error initializing contribution payment:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to initialize payment'
    }, { status: 500 });
  }
}
