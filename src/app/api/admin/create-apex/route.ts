import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuthFromSession, logSecurityEvent } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createLog } from '@/lib/logger';
import { NotificationService } from '@/lib/notifications';
import { getWelcomeEmailHtml } from '@/lib/notifications';
import { isStrongPassword, getPasswordPolicyMessage } from '@/lib/utils';
import { createUserSchema, validateInput } from '@/lib/validation';
import { encryptPII } from '@/lib/encryption';
import { validateRequest } from '@/middleware/validation';

export async function POST(request: NextRequest) {
  try {
    // Get session and validate with proper type safety
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = requireAuthFromSession(session.user, 'SUPER_ADMIN');
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    
    // Validate request with comprehensive input validation
    const validationResult = await validateRequest(request, {
      bodySchema: createUserSchema,
      contentType: 'application/json',
      csrf: true
    });

    if (!validationResult.success) {
      return (validationResult as any).response;
    }

    const { firstName, lastName, email, password, phoneNumber, dateOfBirth, address } = validationResult.data!;
    
    // Additional password strength validation
    if (!isStrongPassword(password)) {
      return NextResponse.json({ 
        error: 'Password does not meet security requirements.',
        details: getPasswordPolicyMessage()
      }, { status: 400 });
    }
    // 4. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 });
    }
    
    // 5. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // 6. Encrypt sensitive PII data
    // Note: For operational needs (login, display), we store plaintext in primary columns.
    // If encryption at rest is required, store encrypted copies in separate columns.
    
    // 7. Create the new Apex user with encrypted data
    // Parse dateOfBirth safely (schema provides ISO string). Only set when valid
    let parsedDob: Date | undefined = undefined;
    if (dateOfBirth) {
      const d = new Date(dateOfBirth);
      if (!isNaN(d.getTime())) {
        parsedDob = d;
      }
    }

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phoneNumber,
        address,
        dateOfBirth: parsedDob,
        role: 'APEX', // Assign the APEX role
      },
    });
    
    // 7. Log the action with security audit
    await createLog({
      action: `Created Apex user: ${email}`,
      user: user,
    });
    
    // 8. Log security event
    await logSecurityEvent(user.id, 'APEX_USER_CREATED', {
      targetEmail: email,
      targetRole: 'APEX',
      timestamp: new Date().toISOString(),
    });
    // Send welcome email (logged via NotificationService)
    try {
      const dashboardUrl = 'https://nogalssapexcoop.org/dashboard/apex';
      const html = getWelcomeEmailHtml({
        name: newUser.firstName,
        email: newUser.email,
        password,
        role: 'APEX',
        dashboardUrl,
      });

      await NotificationService.sendEmail({
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