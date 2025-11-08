import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { isStrongPassword, getPasswordPolicyMessage } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied. Super admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      cooperativeId,
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
      savingFrequency
    } = body;

    // Validate required fields (NIN is optional for super admin)
    const requiredFields = {
      firstName, lastName, password, cooperativeId, dateOfBirth, occupation,
      address, city, lga, state, phoneNumber, nextOfKinName, nextOfKinPhone,
      emergencyContact, emergencyPhone, savingAmount, savingFrequency
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        return NextResponse.json({ error: `Field '${key}' is required.` }, { status: 400 });
      }
    }

    // Validate that at least one of email or phone is provided (NIN is optional)
    if (!email && !phoneNumber) {
      return NextResponse.json({ error: 'At least one of email or phone number must be provided.' }, { status: 400 });
    }

    // Validate NIN format only if provided (optional for super admin)
    if (nin && nin.trim() !== '' && !/^\d{11}$/.test(nin)) {
      return NextResponse.json({ error: 'NIN must be exactly 11 digits if provided.' }, { status: 400 });
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

    // Check if cooperative exists (try by id first, then by registration number)
    let cooperative = await prisma.cooperative.findUnique({
      where: { id: cooperativeId }
    });
    
    // If not found by id, try by registration number
    if (!cooperative) {
      cooperative = await prisma.cooperative.findUnique({
        where: { registrationNumber: cooperativeId }
      });
    }
    
    if (!cooperative) {
      return NextResponse.json({ error: 'Invalid Cooperative. Please check and try again.' }, { status: 404 });
    }

    // Check if member email is already in use (if email provided)
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
      }
    }

    // Check if NIN is already in use (if NIN provided)
    if (nin && nin.trim() !== '') {
      const existingNINUser = await prisma.user.findFirst({ where: { nin } });
      if (existingNINUser) {
        return NextResponse.json({ error: 'A user with this NIN already exists.' }, { status: 409 });
      }
    }

    // Enforce strong password policy
    if (!isStrongPassword(password)) {
      return NextResponse.json({ error: getPasswordPolicyMessage() }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create member user
    const memberUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email || `member_${Date.now()}@nogalss.com`, // Generate email if not provided
        password: hashedPassword,
        role: 'MEMBER',
        cooperativeId: cooperative.id,
        phoneNumber,
        dateOfBirth: new Date(dateOfBirth),
        address,
        nin: nin && nin.trim() !== '' ? nin : null, // Only set NIN if provided
        nextOfKinName,
        nextOfKinPhone,
        isActive: true,
        isVerified: true, // Auto-verify when created by super admin
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    // Note: Saving preferences (savingAmount, savingFrequency) are not stored in the database
    // They may be used for other purposes or stored elsewhere if needed

    // Create virtual account for member (optional, can fail silently)
    try {
      // This would typically call an external service to create a virtual account
      // For now, we'll skip it or create a placeholder
      console.log('Virtual account creation skipped for admin-created member');
    } catch (vaError) {
      console.error('Failed to create virtual account:', vaError);
      // Continue without virtual account
    }

    return NextResponse.json({
      success: true,
      message: 'Member created successfully',
      user: memberUser
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating member:', error);
    
    // Check for unique constraint violation
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('email')) {
        return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
      }
      if (error.meta?.target?.includes('nin')) {
        return NextResponse.json({ error: 'A user with this NIN already exists.' }, { status: 409 });
      }
    }
    
    return NextResponse.json({ 
      error: 'An internal server error occurred.',
      message: error.message 
    }, { status: 500 });
  }
}

