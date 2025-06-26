import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Find the payment record
    const payment = await prisma.payment.findUnique({
      where: { paystackReference: reference },
      include: { 
        transaction: true,
        user: true
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment and transaction status
    const status = paystackData.data.status === 'success' ? 'SUCCESSFUL' : 'FAILED';
    
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status,
          metadata: paystackData.data
        }
      }),
      prisma.transaction.update({
        where: { id: payment.transactionId },
        data: { status }
      })
    ]);

    // Send notifications if payment is successful
    if (status === 'SUCCESSFUL') {
      try {
        const userName = `${payment.user.firstName} ${payment.user.lastName}`;
        
        // Send email notification
        await NotificationService.sendPaymentConfirmationEmail(
          payment.user.email,
          userName,
          Number(payment.amount),
          reference,
          payment.transaction.type
        );

        // Send SMS notification if phone number exists
        if (payment.user.phoneNumber) {
          await NotificationService.sendPaymentConfirmationSMS(
            payment.user.phoneNumber,
            Number(payment.amount),
            reference
          );
        }
      } catch (notificationError) {
        console.error('Notification error:', notificationError);
        // Don't fail the payment verification if notifications fail
      }
    }

    // Redirect to success/failure page
    const redirectUrl = status === 'SUCCESSFUL' 
      ? `${process.env.NEXTAUTH_URL}/payments/success?reference=${reference}`
      : `${process.env.NEXTAUTH_URL}/payments/failed?reference=${reference}`;

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 