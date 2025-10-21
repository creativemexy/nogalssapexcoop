import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notifications';
import bcrypt from 'bcryptjs';
import { sendMail } from '@/lib/email';
import { getWelcomeEmailHtml } from '@/lib/notifications';
import { createVirtualAccount } from '@/lib/paystack';

// Helper function to calculate base amount from total amount (reversing Paystack fee calculation)
function calculateBaseAmountFromTotal(totalPaid: number): number {
  // Paystack fees: 1.5% + NGN 100, capped at NGN 2,000, waived for < NGN 2,500
  // We need to reverse this calculation to get the original base amount
  
  // If total paid is less than 2,500, no fees were applied
  if (totalPaid < 2500) {
    return totalPaid;
  }
  
  // For amounts >= 2,500, we need to solve: totalPaid = baseAmount + min(1.5% * baseAmount + 100, 2000)
  // This is: totalPaid = baseAmount + min(0.015 * baseAmount + 100, 2000)
  
  // Let's try to find the base amount by working backwards
  // If fees were capped at 2000: totalPaid = baseAmount + 2000, so baseAmount = totalPaid - 2000
  // If fees were not capped: totalPaid = baseAmount + 0.015 * baseAmount + 100
  // So: totalPaid = baseAmount * (1 + 0.015) + 100 = baseAmount * 1.015 + 100
  // Therefore: baseAmount = (totalPaid - 100) / 1.015
  
  const baseAmountWithUncappedFees = (totalPaid - 100) / 1.015;
  const feesForUncapped = 0.015 * baseAmountWithUncappedFees + 100;
  
  // If the calculated fees would be <= 2000, use the uncapped calculation
  if (feesForUncapped <= 2000) {
    return baseAmountWithUncappedFees;
  }
  
  // Otherwise, fees were capped at 2000
  return totalPaid - 2000;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Payment verification GET request received');
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');
    
    console.log('📋 URL parameters:', { reference, trxref, searchParams: Object.fromEntries(searchParams) });

    // Use trxref if reference is not available (Paystack sometimes sends trxref)
    const paymentReference = reference || trxref;

    if (!paymentReference) {
      console.log('❌ No reference or trxref provided');
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }
    
    console.log('✅ Using payment reference:', paymentReference);

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${paymentReference}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Check if this is a registration payment by looking for pending registration
    const pendingRegistration = await prisma.pendingRegistration.findFirst({
      where: { reference: paymentReference }
    });

    if (pendingRegistration) {
      console.log('Found pending registration:', pendingRegistration.id);
      // This is a registration payment, handle it differently
      return await handleRegistrationPayment(paymentReference, paystackData, pendingRegistration);
    }

    // Check if this is a contribution payment
    const pendingContribution = await prisma.pendingContribution.findFirst({
      where: { reference: paymentReference }
    });

    if (pendingContribution) {
      console.log('Found pending contribution:', pendingContribution.id);
      console.log('Pending contribution status:', pendingContribution.status);
      
      // Check if contribution has already been processed
      if (pendingContribution.status === 'COMPLETED') {
        console.log('✅ Contribution already processed, redirecting to success');
        return NextResponse.redirect(`https://nogalssapexcoop.org/payments/success?type=contribution&reference=${paymentReference}`);
      }
      
      // This is a contribution payment, handle it differently
      return await handleContributionPayment(paymentReference, paystackData, pendingContribution);
    }

    // Find the payment record for regular payments
    const payment = await prisma.payment.findUnique({
      where: { paystackReference: paymentReference },
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
      ? `https://nogalssapexcoop.org/payments/success?reference=${reference}`
      : `https://nogalssapexcoop.org/payments/failed?reference=${reference}`;

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Payment verification POST request received (webhook)');
    const body = await request.json();
    console.log('📋 Webhook body:', body);
    
    // Handle webhook from Paystack
    const reference = body.data?.reference;
    if (!reference) {
      console.log('❌ No reference in webhook body');
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }
    
    console.log('✅ Processing webhook for reference:', reference);
    
    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok) {
      console.log('❌ Paystack verification failed:', paystackData);
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Check if this is a registration payment
    const pendingRegistration = await prisma.pendingRegistration.findFirst({
      where: { reference: reference }
    });

    if (pendingRegistration) {
      console.log('Found pending registration via webhook:', pendingRegistration.id);
      return await handleRegistrationPayment(reference, paystackData, pendingRegistration);
    }

    // Check if this is a contribution payment
    const pendingContribution = await prisma.pendingContribution.findFirst({
      where: { reference: reference }
    });

    if (pendingContribution) {
      console.log('Found pending contribution via webhook:', pendingContribution.id);
      console.log('Pending contribution status:', pendingContribution.status);
      
      // Check if contribution has already been processed
      if (pendingContribution.status === 'COMPLETED') {
        console.log('✅ Contribution already processed via webhook');
        return NextResponse.json({ success: true, message: 'Contribution already processed' });
      }
      
      return await handleContributionPayment(reference, paystackData, pendingContribution);
    }

    // Handle regular payment webhook
    const payment = await prisma.payment.findUnique({
      where: { paystackReference: reference },
      include: { 
        transaction: true,
        user: true
      }
    });

    if (!payment) {
      console.log('❌ Payment not found for reference:', reference);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment status
    const status = paystackData.data.status === 'success' ? 'SUCCESSFUL' : 'FAILED';
    
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status }
      }),
      prisma.transaction.update({
        where: { id: payment.transaction.id },
        data: { status }
      })
    ]);

    console.log('✅ Payment status updated to:', status);
    return NextResponse.json({ success: true, status });

  } catch (error) {
    console.error('❌ Error in POST payment verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Function to handle registration payments
async function handleRegistrationPayment(reference: string, paystackData: any, pendingRegistration: any) {
  try {
    console.log('🚀 Processing registration payment for:', reference);
    console.log('Paystack data status:', paystackData.data.status);
    console.log('Pending registration ID:', pendingRegistration.id);
    
    if (paystackData.data.status !== 'success') {
      console.log('❌ Payment not successful, status:', paystackData.data.status);
      // Update pending registration as failed
      await prisma.pendingRegistration.update({
        where: { id: pendingRegistration.id },
        data: { status: 'FAILED' }
      });
      
      return NextResponse.redirect(`https://nogalssapexcoop.org/auth/register/error?message=Payment not successful`);
    }

    console.log('✅ Payment successful, parsing registration data...');
    // Parse registration data
    const registrationData = JSON.parse(pendingRegistration.data);
    console.log('Registration type:', pendingRegistration.type);
    console.log('Registration data parsed successfully');

    // Handle different registration types
    if (pendingRegistration.type === 'COOPERATIVE') {
      return await handleCooperativeRegistration(reference, paystackData, registrationData, pendingRegistration);
    } else if (pendingRegistration.type === 'MEMBER') {
      return await handleMemberRegistration(reference, paystackData, registrationData, pendingRegistration);
    } else {
      throw new Error('Unknown registration type');
    }
  } catch (error) {
    console.error('❌ Error in handleRegistrationPayment:', error);
    await prisma.pendingRegistration.update({
      where: { id: pendingRegistration.id },
      data: { status: 'FAILED' }
    });
    return NextResponse.redirect(`https://nogalssapexcoop.org/auth/register/error?message=Registration processing failed`);
  }
}

// Function to handle cooperative registration
async function handleCooperativeRegistration(reference: string, paystackData: any, registrationData: any, pendingRegistration: any) {
  try {
    console.log('🏢 Processing cooperative registration...');
    console.log('Cooperative data:', {
      cooperativeName: registrationData.cooperativeName,
      leaderEmail: registrationData.leaderEmail,
      leaderFirstName: registrationData.leaderFirstName
    });

    // Hash password outside transaction to avoid timeout
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(registrationData.leaderPassword, 12);
    console.log('✅ Password hashed');

    // Create users and cooperative after successful payment
    console.log('🔄 Starting database transaction...');
    const result = await prisma.$transaction(async (tx) => {
      console.log('📝 Creating cooperative...');
      // Create Cooperative
      const cooperative = await tx.cooperative.create({
        data: {
          name: registrationData.cooperativeName,
          registrationNumber: registrationData.cooperativeRegNo,
          bankName: registrationData.bankName,
          bankAccountNumber: registrationData.bankAccountNumber,
          bankAccountName: registrationData.bankAccountName,
          address: registrationData.address,
          city: registrationData.city,
          phoneNumber: registrationData.phone,
          email: registrationData.cooperativeEmail,
        },
      });
      console.log('✅ Cooperative created:', cooperative.id);

      // Create Cooperative User Account
      console.log('👤 Creating cooperative user...');
      const cooperativeUser = await tx.user.create({
        data: {
          firstName: registrationData.cooperativeName,
          lastName: 'Organization',
          email: registrationData.cooperativeEmail || `${registrationData.cooperativeName.toLowerCase().replace(/\s+/g, '')}@nogalss.org`,
          password: hashedPassword,
          role: 'COOPERATIVE',
          cooperativeId: cooperative.id,
          phoneNumber: registrationData.phone,
        },
      });
      console.log('✅ Cooperative user created:', cooperativeUser.id);

      // Create Leader User
      console.log('👤 Creating leader user...');
      const leaderUser = await tx.user.create({
        data: {
          firstName: registrationData.leaderFirstName,
          lastName: registrationData.leaderLastName,
          email: registrationData.leaderEmail,
          password: hashedPassword,
          role: 'LEADER',
          cooperativeId: cooperative.id,
          phoneNumber: registrationData.leaderPhone,
        },
      });
      console.log('✅ Leader user created:', leaderUser.id);

      // Create Leader record
      await tx.leader.create({
        data: {
          userId: leaderUser.id,
          cooperativeId: cooperative.id,
          title: registrationData.leaderTitle,
        },
      });

      // Record the successful payment
      await tx.transaction.create({
        data: {
          amount: paystackData.data.amount,
          type: 'FEE',
          description: 'Cooperative registration fee payment',
          status: 'SUCCESSFUL',
          userId: leaderUser.id,
          cooperativeId: cooperative.id,
          reference: reference
        }
      });

      return { cooperative, cooperativeUser, leaderUser };
    }, {
      timeout: 15000, // 15 seconds timeout
    });

    // Update pending registration status
    await prisma.pendingRegistration.update({
      where: { id: pendingRegistration.id },
      data: { status: 'COMPLETED' }
    });

    // Send welcome emails
    try {
      const leaderDashboardUrl = `https://nogalssapexcoop.org/dashboard/leader`;
      const leaderHtml = getWelcomeEmailHtml({
        name: result.leaderUser.firstName,
        email: result.leaderUser.email,
        password: '[Your chosen password]',
        role: 'LEADER',
        dashboardUrl: leaderDashboardUrl,
        virtualAccount: undefined,
        registrationPaid: true,
      });
      await sendMail({
        to: result.leaderUser.email,
        subject: 'Welcome to Nogalss – Leader Account Activated',
        html: leaderHtml,
      });

      // Send email to cooperative
      const cooperativeDashboardUrl = `https://nogalssapexcoop.org/dashboard/cooperative`;
      const cooperativeHtml = getWelcomeEmailHtml({
        name: result.cooperativeUser.firstName,
        email: result.cooperativeUser.email,
        password: '[Your chosen password]',
        role: 'COOPERATIVE',
        dashboardUrl: cooperativeDashboardUrl,
        virtualAccount: undefined,
        registrationPaid: true,
      });
      await sendMail({
        to: result.cooperativeUser.email,
        subject: 'Welcome to Nogalss – Cooperative Account Activated',
        html: cooperativeHtml,
      });
    } catch (emailError) {
      console.error('Failed to send welcome emails:', emailError);
    }

    // Redirect to success page
    return NextResponse.redirect(`https://nogalssapexcoop.org/auth/register/success?cooperative=${result.cooperative.name}&reference=${reference}`);

  } catch (error) {
    console.error('❌ Registration payment processing error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    // Update pending registration as failed
    await prisma.pendingRegistration.update({
      where: { id: pendingRegistration.id },
      data: { status: 'FAILED' }
    });
    
    return NextResponse.redirect(`https://nogalssapexcoop.org/auth/register/error?message=Registration processing failed: ${error.message}`);
  }
}

// Function to handle member registration
async function handleMemberRegistration(reference: string, paystackData: any, registrationData: any, pendingRegistration: any) {
  try {
    console.log('👤 Processing member registration...');
    console.log('Member data:', {
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      email: registrationData.email,
      cooperativeId: registrationData.cooperativeId
    });

    // Hash password outside transaction to avoid timeout
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(registrationData.password, 12);
    console.log('✅ Password hashed');

    // Create member user after successful payment
    console.log('🔄 Starting database transaction...');
    const result = await prisma.$transaction(async (tx) => {
      console.log('👤 Creating member user...');
      // Create Member User
      const memberUser = await tx.user.create({
        data: {
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          email: registrationData.email,
          password: hashedPassword,
          role: 'MEMBER',
          cooperativeId: registrationData.cooperativeId,
          phoneNumber: registrationData.phoneNumber,
          dateOfBirth: new Date(registrationData.dateOfBirth),
          address: registrationData.address,
          nextOfKinName: registrationData.nextOfKinName,
          nextOfKinPhone: registrationData.nextOfKinPhone,
        },
      });
      console.log('✅ Member user created:', memberUser.id);

      // Record the successful payment (base amount only, excluding Paystack fees)
      // Calculate base amount by reversing the fee calculation
      const totalPaid = paystackData.data.amount / 100; // Convert from kobo to naira
      const baseAmount = calculateBaseAmountFromTotal(totalPaid);
      
      await tx.transaction.create({
        data: {
          amount: Math.round(baseAmount * 100), // Convert back to kobo for storage
          type: 'FEE',
          description: 'Member registration fee payment',
          status: 'SUCCESSFUL',
          userId: memberUser.id,
          cooperativeId: registrationData.cooperativeId,
          reference: reference
        }
      });

      // Create virtual account for member
      console.log('🏦 Creating virtual account for member...');
      try {
        const virtualAccount = await createVirtualAccount({
          userId: memberUser.id,
          accountType: 'MEMBER',
          accountName: `${registrationData.firstName} ${registrationData.lastName}`,
          email: registrationData.email,
          phoneNumber: registrationData.emergencyPhone || ''
        });

        await tx.virtualAccount.create({
          data: {
            userId: memberUser.id,
            accountType: 'MEMBER',
            accountName: virtualAccount.accountName,
            accountNumber: virtualAccount.accountNumber,
            bankName: virtualAccount.bankName,
            bankCode: 'wema-bank', // Default bank code
            customerCode: virtualAccount.customerCode,
            isActive: true
          }
        });
        console.log('✅ Virtual account created for member');
      } catch (vaError) {
        console.error('Failed to create virtual account for member:', vaError);
        // Continue without virtual account
      }

      return { memberUser };
    }, { timeout: 15000 });

    console.log('✅ Member registration completed successfully');

    // Update pending registration as completed
    await prisma.pendingRegistration.update({
      where: { id: pendingRegistration.id },
      data: { status: 'COMPLETED' }
    });

    // Send welcome email to member
    try {
      const dashboardUrl = `https://nogalssapexcoop.org/dashboard/member`;
      const html = getWelcomeEmailHtml({
        name: result.memberUser.firstName,
        email: result.memberUser.email,
        password: registrationData.password,
        role: 'MEMBER',
        dashboardUrl,
        virtualAccount: {
          accountNumber: 'Will be available in dashboard',
          bankName: 'Virtual Account',
          accountName: `${registrationData.firstName} ${registrationData.lastName}`
        },
        registrationPaid: true,
      });
      await sendMail({
        to: result.memberUser.email,
        subject: 'Welcome to Nogalss – Member Account Activated',
        html,
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // Redirect to success page
    return NextResponse.redirect(`https://nogalssapexcoop.org/auth/register/success?member=${result.memberUser.firstName}&reference=${reference}`);

  } catch (error) {
    console.error('❌ Member registration processing error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    // Update pending registration as failed
    await prisma.pendingRegistration.update({
      where: { id: pendingRegistration.id },
      data: { status: 'FAILED' }
    });
    
    return NextResponse.redirect(`https://nogalssapexcoop.org/auth/register/error?message=Member registration processing failed: ${error.message}`);
  }
}

// Function to handle contribution payments
async function handleContributionPayment(reference: string, paystackData: any, pendingContribution: any) {
  try {
    console.log('💰 Processing contribution payment for:', reference);
    console.log('Paystack data status:', paystackData.data.status);
    console.log('Pending contribution ID:', pendingContribution.id);
    
    if (paystackData.data.status !== 'success') {
      console.log('❌ Payment not successful, status:', paystackData.data.status);
      // Update pending contribution as failed
      await prisma.pendingContribution.update({
        where: { id: pendingContribution.id },
        data: { status: 'FAILED' }
      });
      
      return NextResponse.redirect(`https://nogalssapexcoop.org/payments/failed?message=Contribution payment not successful`);
    }

    console.log('✅ Contribution payment successful, processing...');

    // Process the contribution payment
    const result = await prisma.$transaction(async (tx) => {
      // Create contribution record (using base amount, not including fees)
      const contribution = await tx.contribution.create({
        data: {
          userId: pendingContribution.userId,
          cooperativeId: pendingContribution.cooperativeId,
          amount: pendingContribution.amount, // This is the base amount without fees
          description: 'Member contribution via Paystack'
        }
      });

      // Create transaction record with unique reference
      const transaction = await tx.transaction.create({
        data: {
          userId: pendingContribution.userId,
          cooperativeId: pendingContribution.cooperativeId,
          type: 'CONTRIBUTION',
          amount: pendingContribution.amount,
          description: 'Member contribution payment',
          status: 'SUCCESSFUL',
          reference: `${reference}_TXN`
        }
      });

      // Update pending contribution status
      await tx.pendingContribution.update({
        where: { id: pendingContribution.id },
        data: { status: 'COMPLETED' }
      });

      return { contribution, transaction };
    });

    console.log('✅ Contribution processed successfully');

    // Send notification to user
    try {
      const user = await prisma.user.findUnique({
        where: { id: pendingContribution.userId }
      });

      if (user) {
        // Send email notification
        await NotificationService.sendPaymentConfirmationEmail(
          user.email,
          `${user.firstName} ${user.lastName}`,
          Number(pendingContribution.amount) / 100, // Convert from kobo to naira
          reference,
          'CONTRIBUTION'
        );

        // Send SMS notification if phone number exists
        if (user.phoneNumber) {
          await NotificationService.sendPaymentConfirmationSMS(
            user.phoneNumber,
            Number(pendingContribution.amount) / 100,
            reference
          );
        }
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't fail the payment verification if notifications fail
    }

    // Redirect to success page
    return NextResponse.redirect(`https://nogalssapexcoop.org/payments/success?type=contribution&reference=${reference}`);

  } catch (error) {
    console.error('❌ Contribution payment processing error:', error);
    
    // Update pending contribution as failed
    await prisma.pendingContribution.update({
      where: { id: pendingContribution.id },
      data: { status: 'FAILED' }
    });
    
    return NextResponse.redirect(`https://nogalssapexcoop.org/payments/failed?message=Contribution processing failed: ${error.message}`);
  }
} 