import { NextRequest, NextResponse } from 'next/server';
import { korapayClient } from '@/lib/korapay';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-korapay-signature');
    
    if (!signature) {
      console.log('❌ Missing Korapay signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const isValidSignature = korapayClient.verifyWebhookSignature(body, signature);
    if (!isValidSignature) {
      console.log('❌ Invalid Korapay signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const webhookData = JSON.parse(body);
    console.log('🔔 Korapay webhook received:', webhookData);

    const { event, data } = webhookData;

    // Handle different webhook events
    switch (event) {
      case 'charge.success':
        await handleSuccessfulPayment(data);
        break;
      
      case 'charge.failed':
        await handleFailedPayment(data);
        break;
      
      case 'charge.pending':
        await handlePendingPayment(data);
        break;
      
      default:
        console.log('Unhandled webhook event:', event);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Korapay webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSuccessfulPayment(data: any) {
  try {
    console.log('✅ Processing successful payment:', data.reference);
    
    // Check if this is a registration payment
    const pendingRegistration = await prisma.pendingRegistration.findFirst({
      where: { reference: data.reference }
    });

    if (pendingRegistration) {
      console.log('Found pending registration for successful payment');
      // Process registration payment
      // This would call the same logic as in the verify endpoint
      return;
    }

    // Check if this is a contribution payment
    const pendingContribution = await prisma.pendingContribution.findFirst({
      where: { reference: data.reference }
    });

    if (pendingContribution) {
      console.log('Found pending contribution for successful payment');
      // Process contribution payment
      return;
    }

    // Handle regular payment
    const payment = await prisma.payment.findUnique({
      where: { paystackReference: data.reference },
      include: { transaction: true }
    });

    if (payment) {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { 
            status: 'SUCCESSFUL',
            metadata: data
          }
        }),
        prisma.transaction.update({
          where: { id: payment.transactionId },
          data: { status: 'SUCCESSFUL' }
        })
      ]);
      
      console.log('✅ Payment status updated to SUCCESSFUL');
    }

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function handleFailedPayment(data: any) {
  try {
    console.log('❌ Processing failed payment:', data.reference);
    
    // Update payment status to failed
    const payment = await prisma.payment.findUnique({
      where: { paystackReference: data.reference },
      include: { transaction: true }
    });

    if (payment) {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { 
            status: 'FAILED',
            metadata: data
          }
        }),
        prisma.transaction.update({
          where: { id: payment.transactionId },
          data: { status: 'FAILED' }
        })
      ]);
      
      console.log('❌ Payment status updated to FAILED');
    }

  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

async function handlePendingPayment(data: any) {
  try {
    console.log('⏳ Processing pending payment:', data.reference);
    
    // Update payment status to pending
    const payment = await prisma.payment.findUnique({
      where: { paystackReference: data.reference },
      include: { transaction: true }
    });

    if (payment) {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { 
            status: 'PENDING',
            metadata: data
          }
        }),
        prisma.transaction.update({
          where: { id: payment.transactionId },
          data: { status: 'PENDING' }
        })
      ]);
      
      console.log('⏳ Payment status updated to PENDING');
    }

  } catch (error) {
    console.error('Error handling pending payment:', error);
  }
}
