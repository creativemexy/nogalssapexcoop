import { NextRequest, NextResponse } from 'next/server';
import { korapayClient } from '@/lib/korapay';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    
    if (!reference) {
      return NextResponse.json(
        { success: false, message: 'Reference is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Verifying Korapay payment:', reference);

    // Verify payment with Korapay
    const verificationResponse = await korapayClient.verifyPayment(reference);
    
    if (!verificationResponse.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: verificationResponse.message || 'Payment verification failed' 
        },
        { status: 400 }
      );
    }

    const transaction = verificationResponse.data;
    console.log('✅ Payment verified:', {
      reference: transaction.reference,
      status: transaction.status,
      amount: transaction.amount,
    });

    // Check if this is a registration payment
    const pendingRegistration = await prisma.pendingRegistration.findFirst({
      where: { reference: reference }
    });

    if (pendingRegistration) {
      console.log('Found pending registration:', pendingRegistration.id);
      return await handleRegistrationPayment(reference, transaction, pendingRegistration);
    }

    // Check if this is a contribution payment
    const pendingContribution = await prisma.pendingContribution.findFirst({
      where: { reference: reference }
    });

    if (pendingContribution) {
      console.log('Found pending contribution:', pendingContribution.id);
      return await handleContributionPayment(reference, transaction, pendingContribution);
    }

    // Handle regular payment
    return await handleRegularPayment(reference, transaction);

  } catch (error: any) {
    console.error('❌ Korapay payment verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Payment verification failed' 
      },
      { status: 500 }
    );
  }
}

// Handle registration payment
async function handleRegistrationPayment(reference: string, transaction: any, pendingRegistration: any) {
  try {
    if (transaction.status !== 'success') {
      await prisma.pendingRegistration.update({
        where: { id: pendingRegistration.id },
        data: { status: 'FAILED' }
      });
      
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/register/error?message=Payment not successful`);
    }

    // Process registration based on type
    if (pendingRegistration.type === 'COOPERATIVE') {
      return await processCooperativeRegistration(reference, transaction, pendingRegistration);
    } else if (pendingRegistration.type === 'MEMBER') {
      return await processMemberRegistration(reference, transaction, pendingRegistration);
    }

    return NextResponse.json({ success: false, message: 'Unknown registration type' }, { status: 400 });

  } catch (error) {
    console.error('Registration payment processing error:', error);
    await prisma.pendingRegistration.update({
      where: { id: pendingRegistration.id },
      data: { status: 'FAILED' }
    });
    
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/register/error?message=Registration processing failed`);
  }
}

// Handle contribution payment
async function handleContributionPayment(reference: string, transaction: any, pendingContribution: any) {
  try {
    if (transaction.status !== 'success') {
      await prisma.pendingContribution.update({
        where: { id: pendingContribution.id },
        data: { status: 'FAILED' }
      });
      
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/payments/failed?message=Contribution payment not successful`);
    }

    // Process contribution
    await prisma.$transaction(async (tx) => {
      // Create contribution record
      await tx.contribution.create({
        data: {
          userId: pendingContribution.userId,
          cooperativeId: pendingContribution.cooperativeId,
          amount: pendingContribution.amount,
          description: 'Member contribution via Korapay'
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: pendingContribution.userId,
          cooperativeId: pendingContribution.cooperativeId,
          type: 'CONTRIBUTION',
          amount: pendingContribution.amount,
          description: 'Member contribution payment',
          status: 'SUCCESSFUL',
          reference: reference
        }
      });

      // Update pending contribution
      await tx.pendingContribution.update({
        where: { id: pendingContribution.id },
        data: { status: 'COMPLETED' }
      });
    });

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/payments/success?type=contribution&reference=${reference}`);

  } catch (error) {
    console.error('Contribution payment processing error:', error);
    await prisma.pendingContribution.update({
      where: { id: pendingContribution.id },
      data: { status: 'FAILED' }
    });
    
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/payments/failed?message=Contribution processing failed`);
  }
}

// Handle regular payment
async function handleRegularPayment(reference: string, transaction: any) {
  try {
    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { paystackReference: reference },
      include: { transaction: true, user: true }
    });

    if (!payment) {
      return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
    }

    // Update payment status
    const status = transaction.status === 'success' ? 'SUCCESSFUL' : 'FAILED';
    
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status, metadata: transaction }
      }),
      prisma.transaction.update({
        where: { id: payment.transactionId },
        data: { status }
      })
    ]);

    // Redirect to success/failure page
    const redirectUrl = status === 'SUCCESSFUL' 
      ? `${process.env.NEXTAUTH_URL}/payments/success?reference=${reference}`
      : `${process.env.NEXTAUTH_URL}/payments/failed?reference=${reference}`;

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Regular payment processing error:', error);
    return NextResponse.json({ success: false, message: 'Payment processing failed' }, { status: 500 });
  }
}

// Process cooperative registration
async function processCooperativeRegistration(reference: string, transaction: any, pendingRegistration: any) {
  // Implementation for cooperative registration processing
  // This would be similar to the existing Paystack implementation
  // but adapted for Korapay
  console.log('Processing cooperative registration with Korapay');
  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/register/success?cooperative=Test&reference=${reference}`);
}

// Process member registration
async function processMemberRegistration(reference: string, transaction: any, pendingRegistration: any) {
  // Implementation for member registration processing
  // This would be similar to the existing Paystack implementation
  // but adapted for Korapay
  console.log('Processing member registration with Korapay');
  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/register/success?member=Test&reference=${reference}`);
}
