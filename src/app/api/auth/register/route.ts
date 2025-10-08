import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { createLog } from '@/lib/logger';
import { sendMail, getPasswordResetLink } from '@/lib/email';
import { getWelcomeEmailHtml } from '@/lib/notifications';
import { isStrongPassword, getPasswordPolicyMessage } from '@/lib/utils';
import { createVirtualAccount } from '@/lib/paystack';


// Dummy password reset token generator for demonstration
async function createPasswordResetToken(email: string) {
  // In production, generate a secure token and store it in DB
  return 'test-reset-token';
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { registrationType } = body;

        if (registrationType === 'COOPERATIVE') {
            const { 
                cooperativeName, cooperativeRegNo, bankName, bankAccountNumber, bankAccountName,
                address, city, lga, state, phone, cooperativeEmail,
                leaderFirstName, leaderLastName, leaderEmail, leaderPassword,
                leaderPhone, leaderTitle
            } = body;

            // Validate input for all required fields
            const requiredFields = {
                cooperativeName, cooperativeRegNo, bankName, bankAccountNumber, bankAccountName,
                address, city, lga, state, phone,
                leaderFirstName, leaderLastName, leaderEmail, leaderPassword,
                leaderPhone, leaderTitle
            };

            for (const [key, value] of Object.entries(requiredFields)) {
                if (!value) {
                    return NextResponse.json({ error: `Field '${key}' is required.` }, { status: 400 });
                }
            }

            // Validate phone number format (11 digits)
            if (phone && !/^\d{11}$/.test(phone)) {
                return NextResponse.json({ error: 'Organization phone number must be exactly 11 digits.' }, { status: 400 });
            }

            // Validate bank account number format (10 digits)
            if (bankAccountNumber && !/^\d{10}$/.test(bankAccountNumber)) {
                return NextResponse.json({ error: 'Bank account number must be exactly 10 digits.' }, { status: 400 });
            }

            // Validate leader phone number format (11 digits)
            if (leaderPhone && !/^\d{11}$/.test(leaderPhone)) {
                return NextResponse.json({ error: 'Leader phone number must be exactly 11 digits.' }, { status: 400 });
            }

            // Validate leader bank account number format (10 digits)
            if (leaderBankAccountNumber && !/^\d{10}$/.test(leaderBankAccountNumber)) {
                return NextResponse.json({ error: 'Leader bank account number must be exactly 10 digits.' }, { status: 400 });
            }
            // Check if leader email is already in use
            const existingUser = await prisma.user.findUnique({ where: { email: leaderEmail } });
            if (existingUser) {
                return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
            }
            // Check if cooperative registration number is already in use
            const existingCooperative = await prisma.cooperative.findUnique({ where: { registrationNumber: cooperativeRegNo } });
            if (existingCooperative) {
                return NextResponse.json({ error: 'A co-operative with this registration number already exists.' }, { status: 409 });
            }
            // Get registration fee from system settings
            const registrationFeeSetting = await prisma.systemSettings.findFirst({
                where: { 
                    category: 'payment',
                    key: 'registration_fee' 
                }
            });
            const defaultFee = 50000; // ₦500.00 in kobo
            const baseRegistrationFee = registrationFeeSetting ? parseInt(registrationFeeSetting.value) : defaultFee;
            
            // Calculate Paystack transaction fees (1.5% + NGN 100, capped at NGN 2,000, waived for < NGN 2,500)
            const baseAmount = baseRegistrationFee / 100; // Convert to naira
            let transactionFee = 0;
            
            if (baseAmount >= 2500) {
                // Calculate 1.5% + NGN 100
                const percentageFee = baseAmount * 0.015; // 1.5%
                const fixedFee = 100; // NGN 100
                transactionFee = Math.min(percentageFee + fixedFee, 2000); // Cap at NGN 2,000
            }
            // If baseAmount < 2500, transactionFee remains 0 (waived)
            
            const totalAmount = baseAmount + transactionFee;
            const registrationFee = Math.round(totalAmount * 100); // Convert back to kobo

            // Store registration data temporarily (don't create users yet)
            const registrationData = {
                cooperativeName,
                cooperativeRegNo,
                        bankName,
                        bankAccountNumber,
                bankAccountName,
                        address,
                        city,
                phone,
                cooperativeEmail: cooperativeEmail || leaderEmail,
                leaderFirstName,
                leaderLastName,
                leaderEmail,
                leaderPassword,
                leaderPhone,
                leaderTitle
            };

            // Generate a single reference for both pending registration and Paystack
            const reference = `REG_${Date.now()}`;

            // Store in a temporary table or use a different approach
            // For now, we'll create a pending registration record
            const pendingRegistration = await prisma.pendingRegistration.create({
                data: {
                    type: 'COOPERATIVE',
                    data: JSON.stringify(registrationData),
                    reference: reference,
                    status: 'PENDING'
                }
            });
            
            console.log('Created pending registration:', {
                id: pendingRegistration.id,
                reference: pendingRegistration.reference,
                type: pendingRegistration.type,
                status: pendingRegistration.status
            });

            // Create Paystack payment session for registration fee
            const paystackPayload = {
                        email: leaderEmail,
                amount: registrationFee,
                currency: 'NGN',
                reference: reference,
                callback_url: `${process.env.NEXTAUTH_URL}/api/payments/verify`,
                metadata: {
                    pendingRegistrationId: pendingRegistration.id,
                    cooperativeName: cooperativeName,
                    leaderEmail: leaderEmail,
                    registrationType: 'COOPERATIVE'
                }
            };
            
            console.log('Initializing Paystack payment with payload:', JSON.stringify(paystackPayload, null, 2));
            
            const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paystackPayload)
            });

            console.log('Paystack response status:', paystackResponse.status);
            
            if (!paystackResponse.ok) {
                const errorText = await paystackResponse.text();
                console.log('Paystack initialization failed:', errorText);
                // Clean up pending registration if payment fails
                await prisma.pendingRegistration.delete({
                    where: { id: pendingRegistration.id }
                });
                throw new Error('Failed to initialize payment with Paystack');
            }

            const paymentData = await paystackResponse.json();
            console.log('Paystack payment data:', JSON.stringify(paymentData, null, 2));

            return NextResponse.json({ 
              message: 'Registration initiated. Please complete payment to activate your accounts.',
              payment: {
                authorizationUrl: paymentData.data.authorization_url,
                reference: paymentData.data.reference,
                amount: registrationFee,
                amountFormatted: `₦${(registrationFee / 100).toLocaleString()}`,
                feeBreakdown: {
                  baseAmount: `₦${baseAmount.toLocaleString()}`,
                  transactionFee: `₦${transactionFee.toLocaleString()}`,
                  totalAmount: `₦${totalAmount.toLocaleString()}`
                }
              },
              instructions: {
                payment: 'Complete payment to activate your accounts and virtual accounts',
                virtualAccounts: 'Virtual accounts will be created after successful payment',
                login: 'You will receive login credentials after payment completion'
              }
            }, { status: 201 });

        } else if (registrationType === 'MEMBER') {
            const { firstName, lastName, email, password, cooperativeCode, nin, dateOfBirth, occupation, address, city, lga, state, phoneNumber, nextOfKinName, nextOfKinPhone, emergencyContact, emergencyPhone, savingAmount, savingFrequency } = body;
            
            // Validate input for all required fields
            const requiredFields = {
                firstName, lastName, email, password, cooperativeCode, nin, dateOfBirth, occupation, address, city, lga, state, phoneNumber, nextOfKinName, nextOfKinPhone, emergencyContact, emergencyPhone, savingAmount, savingFrequency
            };

            for (const [key, value] of Object.entries(requiredFields)) {
                if (!value) {
                    return NextResponse.json({ error: `Field '${key}' is required.` }, { status: 400 });
                }
            }

            // Validate NIN format (10 digits)
            if (nin && !/^\d{10}$/.test(nin)) {
                return NextResponse.json({ error: 'NIN must be exactly 10 digits.' }, { status: 400 });
            }

            // Validate phone number format (11 digits)
            if (phoneNumber && !/^\d{11}$/.test(phoneNumber)) {
                return NextResponse.json({ error: 'Phone number must be exactly 11 digits.' }, { status: 400 });
            }

            // Validate next of kin phone number format (11 digits)
            if (nextOfKinPhone && !/^\d{11}$/.test(nextOfKinPhone)) {
                return NextResponse.json({ error: 'Next of kin phone number must be exactly 11 digits.' }, { status: 400 });
            }

            // Validate emergency contact phone number format (11 digits)
            if (emergencyPhone && !/^\d{11}$/.test(emergencyPhone)) {
                return NextResponse.json({ error: 'Emergency contact phone number must be exactly 11 digits.' }, { status: 400 });
            }

            // Check if co-operative exists
            const cooperative = await prisma.cooperative.findUnique({ where: { registrationNumber: cooperativeCode } });
            if (!cooperative) {
                return NextResponse.json({ error: 'Invalid Co-operative Code. Please check the code and try again.' }, { status: 404 });
            }

            // Check if member email is already in use
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
            }

            // Enforce strong password policy for member
            if (!isStrongPassword(password)) {
                return NextResponse.json({ error: getPasswordPolicyMessage() }, { status: 400 });
            }

            // Get registration fee from system settings
            const registrationFeeSetting = await prisma.systemSettings.findFirst({
                where: { 
                    category: 'payment',
                    key: 'registration_fee' 
                }
            });
            const defaultFee = 50000; // ₦500.00 in kobo
            const baseRegistrationFee = registrationFeeSetting ? parseInt(registrationFeeSetting.value) : defaultFee;
            
            // Calculate Paystack transaction fees (1.5% + NGN 100, capped at NGN 2,000, waived for < NGN 2,500)
            const baseAmount = baseRegistrationFee / 100; // Convert to naira
            let transactionFee = 0;
            
            if (baseAmount >= 2500) {
                // Calculate 1.5% + NGN 100
                const percentageFee = baseAmount * 0.015; // 1.5%
                const fixedFee = 100; // NGN 100
                transactionFee = Math.min(percentageFee + fixedFee, 2000); // Cap at NGN 2,000
            }
            // If baseAmount < 2500, transactionFee remains 0 (waived)
            
            const totalAmount = baseAmount + transactionFee;
            const registrationFee = Math.round(totalAmount * 100); // Convert back to kobo

            // Store registration data temporarily (don't create user yet)
            const registrationData = {
                    firstName,
                    lastName,
                    email,
                password,
                cooperativeCode,
                nin,
                dateOfBirth,
                occupation,
                address,
                city,
                lga,
                state,
                phoneNumber,
                nextOfKinName,
                nextOfKinPhone,
                emergencyContact,
                emergencyPhone,
                savingAmount,
                savingFrequency,
                cooperativeId: cooperative.id
            };

            // Generate a single reference for both pending registration and Paystack
            const reference = `REG_${Date.now()}`;

            // Create pending registration
            const pendingRegistration = await prisma.pendingRegistration.create({
                data: {
                    type: 'MEMBER',
                    data: JSON.stringify(registrationData),
                    status: 'PENDING',
                    reference: reference
                }
            });

            // Initialize Paystack payment
            const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    amount: registrationFee,
                    reference: reference,
                    callback_url: `${process.env.NEXTAUTH_URL}/api/payments/verify`,
                    metadata: {
                        pendingRegistrationId: pendingRegistration.id,
                        registrationType: 'MEMBER'
                    }
                })
            });

            if (!paystackResponse.ok) {
                throw new Error('Failed to initialize Paystack payment');
            }

            const paymentData = await paystackResponse.json();

            return NextResponse.json({
                message: 'Member registration initiated. Please complete payment to finish registration.',
                payment: {
                    authorizationUrl: paymentData.data.authorization_url,
                    reference: paymentData.data.reference,
                    amount: registrationFee,
                    amountFormatted: `₦${(registrationFee / 100).toLocaleString()}`,
                    feeBreakdown: {
                        baseAmount: `₦${baseAmount.toLocaleString()}`,
                        transactionFee: `₦${transactionFee.toLocaleString()}`,
                        totalAmount: `₦${totalAmount.toLocaleString()}`
                    }
                },
                accounts: {
                    member: 'Member account will be created after successful payment'
                },
                virtualAccounts: 'Virtual account will be created after successful payment',
                login: 'You will receive login credentials after payment completion'
            }, { status: 201 });
        } else {
            return NextResponse.json({ error: 'Invalid registration type.' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Registration error:', error);
        // Check for unique constraint violation
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
             return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
} 