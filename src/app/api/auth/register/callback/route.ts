import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWelcomeEmailHtml } from '@/lib/notifications';
import { sendMail } from '@/lib/email';
import bcrypt from 'bcryptjs';

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

// Function to create virtual account via Paystack
async function createVirtualAccount({ userId, accountType, accountName, email, phoneNumber }) {
  try {
    // Create customer in Paystack
    const customerResponse = await fetch('https://api.paystack.co/customer', {
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

    if (!customerResponse.ok) {
      throw new Error('Failed to create customer with Paystack');
    }

    const customerData = await customerResponse.json();

    // Create dedicated account for the customer
    const dedicatedAccountResponse = await fetch('https://api.paystack.co/dedicated_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: customerData.data.customer_code,
        preferred_bank: 'wema-bank', // Default bank
        split_code: process.env.PAYSTACK_SPLIT_CODE // If you have a split code
      })
    });

    if (!dedicatedAccountResponse.ok) {
      throw new Error('Failed to create dedicated account');
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
        customerCode: customerData.data.customer_code,
        isActive: true
      }
    });

    return {
      id: virtualAccount.id,
      accountName: virtualAccount.accountName,
      accountNumber: virtualAccount.accountNumber,
      bankName: virtualAccount.bankName,
      accountType: virtualAccount.accountType,
      isActive: virtualAccount.isActive
    };

  } catch (error) {
    console.error('Error creating virtual account:', error);
    // Return a mock virtual account for development
    return {
      id: `mock_${Date.now()}`,
      accountName,
      accountNumber: `1234567890${Math.floor(Math.random() * 1000)}`,
      bankName: 'Wema Bank',
      accountType,
      isActive: true
    };
  }
}

export async function GET(request: NextRequest) {
  console.log('🚀 CALLBACK REACHED - Starting payment callback processing');
  try {
    console.log('=== PAYMENT CALLBACK DEBUG ===');
    console.log('Full URL:', request.url);
    console.log('Raw search params:', request.nextUrl.searchParams.toString());
    
    const reference = request.nextUrl.searchParams.get('reference');
    const trxref = request.nextUrl.searchParams.get('trxref');
    const status = request.nextUrl.searchParams.get('status');
    
    console.log('Extracted parameters:', { reference, trxref, status });
    console.log('Reference type:', typeof reference, 'Value:', reference);
    console.log('Trxref type:', typeof trxref, 'Value:', trxref);
    
    // Fallback: manually parse URL if searchParams fails
    let manualReference = null;
    let manualTrxref = null;
    try {
      const url = new URL(request.url);
      manualReference = url.searchParams.get('reference');
      manualTrxref = url.searchParams.get('trxref');
      console.log('Manual parsing result:', { manualReference, manualTrxref });
    } catch (e) {
      console.log('Manual URL parsing failed:', e);
    }
    
    // Use trxref if available, otherwise use reference
    const paymentReference = trxref || reference || manualTrxref || manualReference;
    console.log('Payment reference result:', paymentReference);

    if (!paymentReference) {
      console.log('ERROR: No payment reference found!');
      console.log('Reference:', reference);
      console.log('Trxref:', trxref);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/register/error?message=Payment reference is required`);
    }
    
    console.log('Using payment reference:', paymentReference);
    
    // For now, let's just redirect to success to test if the callback is working
    console.log('✅ TESTING: Redirecting to success page');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/register/success?cooperative=Test&reference=${paymentReference}`);

    // Verify payment with Paystack
    console.log('Verifying payment with Paystack for reference:', paymentReference);
    const verificationResponse = await fetch(`https://api.paystack.co/transaction/verify/${paymentReference}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    console.log('Paystack verification response status:', verificationResponse.status);
    
    if (!verificationResponse.ok) {
      const errorText = await verificationResponse.text();
      console.log('Paystack verification failed:', errorText);
      return NextResponse.json({ error: 'Failed to verify payment' }, { status: 400 });
    }

    const verificationData = await verificationResponse.json();
    console.log('Paystack verification data:', JSON.stringify(verificationData, null, 2));

    if (verificationData.data.status !== 'success') {
      return NextResponse.json({ 
        error: 'Payment not successful',
        status: verificationData.data.status 
      }, { status: 400 });
    }

    // Extract pending registration ID from metadata
    const pendingRegistrationId = verificationData.data.metadata?.pendingRegistrationId;
    console.log('Pending registration ID from metadata:', pendingRegistrationId);
    
    if (!pendingRegistrationId) {
      console.log('No pending registration ID found in metadata:', verificationData.data.metadata);
      return NextResponse.json({ error: 'Invalid payment reference' }, { status: 400 });
    }

    // Find the pending registration
    console.log('Looking for pending registration with ID:', pendingRegistrationId);
    const pendingRegistration = await prisma.pendingRegistration.findUnique({
      where: { id: pendingRegistrationId }
    });

    console.log('Found pending registration:', pendingRegistration ? 'Yes' : 'No');
    
    if (!pendingRegistration) {
      return NextResponse.json({ error: 'Pending registration not found' }, { status: 404 });
    }

    if (pendingRegistration.status !== 'PENDING') {
      console.log('Registration already processed with status:', pendingRegistration.status);
      return NextResponse.json({ error: 'Registration already processed' }, { status: 400 });
    }

    // Parse registration data
    const registrationData = JSON.parse(pendingRegistration.data);

    // Create users and cooperative after successful payment
    const result = await prisma.$transaction(async (tx) => {
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
          parentOrganizationId: registrationData.parentOrganizationId,
        },
      });

      // Hash password
      const hashedPassword = await bcrypt.hash(registrationData.leaderPassword, 12);

      // Create Cooperative User Account
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

      // Create Leader User
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

      // Create Leader record
      await tx.leader.create({
        data: {
          userId: leaderUser.id,
          cooperativeId: cooperative.id,
          title: registrationData.leaderTitle,
        },
      });

      // Record the successful payment (base amount only, excluding Paystack fees)
      // Calculate base amount by reversing the fee calculation
      const totalPaid = verificationData.data.amount / 100; // Convert from kobo to naira
      const baseAmount = calculateBaseAmountFromTotal(totalPaid);
      
      await tx.transaction.create({
        data: {
          amount: Math.round(baseAmount * 100), // Convert back to kobo for storage
          type: 'FEE',
          description: 'Cooperative registration fee payment',
          status: 'SUCCESSFUL',
          userId: leaderUser.id,
          cooperativeId: cooperative.id,
          reference: reference
        }
      });

      return { cooperative, cooperativeUser, leaderUser };
    });

    // Create virtual accounts for both leader and cooperative
    try {
      // Create virtual account for leader
      const leaderVirtualAccount = await createVirtualAccount({
        userId: result.leaderUser.id,
        accountType: 'LEADER',
        accountName: `${registrationData.leaderFirstName} ${registrationData.leaderLastName}`,
        email: registrationData.leaderEmail,
        phoneNumber: registrationData.leaderPhone
      });

      // Create virtual account for cooperative
      const cooperativeVirtualAccount = await createVirtualAccount({
        userId: result.cooperativeUser.id,
        accountType: 'COOPERATIVE',
        accountName: registrationData.cooperativeName,
        email: registrationData.cooperativeEmail || registrationData.leaderEmail,
        phoneNumber: registrationData.phone
      });

      // Update pending registration status
      await prisma.pendingRegistration.update({
        where: { id: pendingRegistrationId },
        data: { status: 'COMPLETED' }
      });

      // Send welcome emails with virtual account information
      const leaderDashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard/leader`;
      const leaderHtml = getWelcomeEmailHtml({
        name: result.leaderUser.firstName,
        email: result.leaderUser.email,
        password: '[Your chosen password]',
        role: 'LEADER',
        dashboardUrl: leaderDashboardUrl,
        virtualAccount: leaderVirtualAccount,
        registrationPaid: true,
      });
      await sendMail({
        to: result.leaderUser.email,
        subject: 'Welcome to Nogalss – Leader Account Activated',
        html: leaderHtml,
      });

      // Send email to cooperative
      const cooperativeDashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard/cooperative`;
      const cooperativeHtml = getWelcomeEmailHtml({
        name: result.cooperativeUser.firstName,
        email: result.cooperativeUser.email,
        password: '[Your chosen password]',
        role: 'COOPERATIVE',
        dashboardUrl: cooperativeDashboardUrl,
        virtualAccount: cooperativeVirtualAccount,
        registrationPaid: true,
      });
      await sendMail({
        to: result.cooperativeUser.email,
        subject: 'Welcome to Nogalss – Cooperative Account Activated',
        html: cooperativeHtml,
      });

    } catch (err) {
      console.error('Failed to create virtual accounts or send emails:', err);
      // Update pending registration as failed
      await prisma.pendingRegistration.update({
        where: { id: pendingRegistrationId },
        data: { status: 'FAILED' }
      });
    }

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/register/success?cooperative=${result.cooperative.name}&reference=${paymentReference}`);

  } catch (error) {
    console.error('❌ ERROR in payment callback:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/register/error?message=Payment processing failed`);
  }
}
