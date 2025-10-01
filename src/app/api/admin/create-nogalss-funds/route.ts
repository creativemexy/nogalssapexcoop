import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NotificationService, getWelcomeEmailHtml } from '@/lib/notifications';
import { createLog } from '@/lib/logger';
import { isStrongPassword, getPasswordPolicyMessage } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { firstName, lastName, email, phoneNumber, address, password } = body;
    if (!firstName || !lastName || !email || !phoneNumber || !address || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }
    if (!isStrongPassword(password)) {
      return NextResponse.json({ error: getPasswordPolicyMessage() }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        address,
        password: hashedPassword,
        role: 'NOGALSS_FUNDS',
        isActive: true
      }
    });

    // Log action
    await createLog({ action: `Created Nogalss Funds user: ${email}`, user: session.user });

    // Send welcome email (logged via NotificationService)
    try {
      const dashboardUrl = 'https://nogalssapexcoop.org/dashboard/nogalss-funds';
      const html = getWelcomeEmailHtml({
        name: user.firstName,
        email: user.email,
        password,
        role: 'NOGALSS_FUNDS',
        dashboardUrl,
      });
      await NotificationService.sendEmail({
        to: user.email,
        subject: 'Welcome to Nogalss – Nogalss Funds User Account Created',
        html,
      });
    } catch (err) {
      console.error('Failed to send nogalss funds user welcome email:', err);
    }
    return NextResponse.json({ 
      message: 'Nogalss Funds user created successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      password: password // Return the plain password for display
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating nogalss funds user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
