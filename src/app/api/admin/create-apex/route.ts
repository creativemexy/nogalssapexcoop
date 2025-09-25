import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createLog } from '@/lib/logger';
import { sendMail } from '@/lib/email';
import { getWelcomeEmailHtml } from '@/lib/notifications';
import { isStrongPassword, getPasswordPolicyMessage } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // 1. Check if user is authenticated and is a SUPER_ADMIN
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { firstName, lastName, email, password } = await request.json();
    // 2. Validate input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (!isStrongPassword(password)) {
        return NextResponse.json({ error: getPasswordPolicyMessage() }, { status: 400 });
    }
    // 3. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 });
    }
    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    // 5. Create the new Apex user
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'APEX', // Assign the APEX role
      },
    });
    // Log the action
    await createLog({
      action: `Created Apex user: ${email}`,
      user: session.user,
    });
    // Send welcome email
    try {
      const dashboardUrl = 'https://nogalssapexcoop.org/dashboard/apex';
      const html = getWelcomeEmailHtml({
        name: newUser.firstName,
        email: newUser.email,
        password,
        role: 'APEX',
        dashboardUrl,
      });
      await sendMail({
        to: newUser.email,
        subject: 'Welcome to Nogalss – Apex User Account Created',
        html,
      });
    } catch (err) {
      console.error('Failed to send apex user welcome email:', err);
    }
    // Remove password from the returned object
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json({
      message: 'Apex user created successfully',
      user: userWithoutPassword,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating Apex user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 