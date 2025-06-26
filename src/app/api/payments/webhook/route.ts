import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;

      // Find and update payment
      const payment = await prisma.payment.findUnique({
        where: { paystackReference: reference },
        include: { transaction: true }
      });

      if (payment) {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { 
              status: 'SUCCESSFUL',
              metadata: event.data
            }
          }),
          prisma.transaction.update({
            where: { id: payment.transactionId },
            data: { status: 'SUCCESSFUL' }
          })
        ]);

        // Handle specific transaction types
        if (payment.transaction.type === 'CONTRIBUTION') {
          await prisma.contribution.create({
            data: {
              userId: payment.userId,
              cooperativeId: payment.cooperativeId!,
              amount: payment.amount,
              description: payment.transaction.description || 'Contribution payment'
            }
          });
        }
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 