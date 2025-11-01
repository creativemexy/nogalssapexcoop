import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createLog } from '@/lib/logger';
import { NotificationService } from '@/lib/notifications';
import bcrypt from 'bcryptjs';

// GET - Fetch all parent organizations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin or apex
    const userRole = (session.user as any).role;
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'APEX') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const parentId = searchParams.get('parentId') || null;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (parentId === 'null' || parentId === '') {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    // Check if the parentOrganization table exists
    try {
      const [organizations, total] = await Promise.all([
        prisma.parentOrganization.findMany({
          where,
          include: {
            parent: true,
            children: true,
            cooperatives: {
              select: {
                id: true,
                name: true,
                _count: {
                  select: {
                    members: true,
                  },
                },
              },
            },
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.parentOrganization.count({ where }),
      ]);

      return NextResponse.json({
        organizations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      });
    } catch (error: any) {
      // If the table doesn't exist yet, return empty results
      if (error.message?.includes('parentOrganization') || error.code === 'P2021') {
        return NextResponse.json({
          organizations: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error fetching parent organizations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new parent organization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin or apex
    const userRole = (session.user as any).role;
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'APEX') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      contactEmail,
      contactPhone,
      address,
      website,
      logo,
      parentId,
      // CAC Registration Details
      rcNumber,
      companyType,
      registrationDate,
      businessActivities,
      // Additional CAC Information
      tin,
      vatNumber,
      registryNumber,
      companyStatus,
      city,
      state,
      lga,
      branchAddress,
      objectives,
      // Share Capital Information
      shareCapitalInWords,
      paidUpCapital,
      subscribedShareCapital,
      sharesIssued,
      sharesValue,
      // Company Contact Persons
      companyContactName,
      companyContactEmail,
      companyContactPhone,
      // Key Personnel - Secretary
      secretaryName,
      secretaryEmail,
      secretaryPhone,
      secretaryAddress,
      // Directors
      director1Name,
      director1Email,
      director1Phone,
      director1Address,
      director1Occupation,
      director1Nationality,
      // Shareholders
      shareholder1Name,
      shareholder1Shares,
      shareholder1Percentage,
      shareholder1Address,
      shareholder1Nationality,
      // President Details
      presidentFirstName,
      presidentLastName,
      presidentEmail,
      presidentPhone,
      // Bank Details
      bankName,
      bankAccountNumber,
      bankAccountName,
    } = body;

    // Validate required fields
    if (!name || !contactEmail) {
      return NextResponse.json({ 
        error: 'Name and contact email are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Check if parent organization exists (if parentId is provided)
    if (parentId) {
      const parentOrg = await prisma.parentOrganization.findUnique({
        where: { id: parentId },
      });
      
      if (!parentOrg) {
        return NextResponse.json({ 
          error: 'Parent organization not found' 
        }, { status: 404 });
      }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: contactEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please use a different email address.' },
        { status: 400 }
      );
    }

    // Create the parent organization with user account
    try {
      const defaultPassword = 'Parpass@25';
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);

      // Create user account for the parent organization
      const organizationUser = await prisma.user.create({
        data: {
          firstName: name,
          lastName: 'Organization',
          email: contactEmail,
          password: hashedPassword,
          role: 'PARENT_ORGANIZATION',
          phoneNumber: contactPhone,
          isActive: true,
          isVerified: true,
        },
      });

      // Create the parent organization
      const organization = await prisma.parentOrganization.create({
        data: {
          name,
          description,
          contactEmail,
          contactPhone,
          address,
          website,
          logo,
          parentId: parentId || null,
          createdBy: (session.user as any).id,
          userId: organizationUser.id,
          defaultPassword: defaultPassword,
          // CAC Registration Details
          rcNumber,
          companyType,
          registrationDate: registrationDate ? new Date(registrationDate) : null,
          businessActivities,
          // Additional CAC Information
          tin,
          vatNumber,
          registryNumber,
          companyStatus,
          city,
          state,
          lga,
          branchAddress,
          objectives,
          // Share Capital Information
          shareCapitalInWords,
          paidUpCapital,
          subscribedShareCapital,
          sharesIssued,
          sharesValue,
          // Company Contact Persons
          companyContactName,
          companyContactEmail,
          companyContactPhone,
          // Key Personnel - Secretary
          secretaryName,
          secretaryEmail,
          secretaryPhone,
          secretaryAddress,
          // Directors
          director1Name,
          director1Email,
          director1Phone,
          director1Address,
          director1Occupation,
          director1Nationality,
          // Shareholders
          shareholder1Name,
          shareholder1Shares,
          shareholder1Percentage,
          shareholder1Address,
          shareholder1Nationality,
          // President Details
          presidentFirstName,
          presidentLastName,
          presidentEmail,
          presidentPhone,
          // Bank Details
          bankName,
          bankAccountNumber,
          bankAccountName,
        },
        include: {
          parent: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Send email and SMS notifications
      try {

        // Send email notification
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Nogalss Parent Organization Dashboard</h2>
            <p>Dear ${name} Team,</p>
            <p>Your parent organization account has been created successfully. You can now access your dashboard using the following credentials:</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Email:</strong> ${contactEmail}</p>
              <p><strong>Password:</strong> ${defaultPassword}</p>
              <p><strong>Dashboard URL:</strong> <a href="${process.env.NEXTAUTH_URL}/dashboard/parent-organization">${process.env.NEXTAUTH_URL}/dashboard/parent-organization</a></p>
            </div>
            <p>Please change your password after your first login for security purposes.</p>
            <p>Best regards,<br>Nogalss Team</p>
          </div>
        `;

        await NotificationService.sendEmail({
          to: contactEmail,
          subject: 'Welcome to Nogalss Parent Organization Dashboard',
          html: emailHtml,
        });

        // Send SMS notification if phone number is provided
        if (contactPhone) {
          const smsMessage = `Welcome to Nogalss! Your parent organization dashboard is ready. Login: ${contactEmail}, Password: ${defaultPassword}. Dashboard: ${process.env.NEXTAUTH_URL}/dashboard/parent-organization`;
          
          await NotificationService.sendSMS({
            to: contactPhone,
            message: smsMessage,
          });
        }
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Don't fail the organization creation if notifications fail
      }

      // Log the action
      await createLog({ 
        action: `Created parent organization: ${name} with user account`, 
        user: session.user 
      });

      return NextResponse.json(organization, { status: 201 });
    } catch (error: any) {
      if (error.message?.includes('parentOrganization') || error.code === 'P2021') {
        return NextResponse.json({ 
          error: 'Parent organization table does not exist. Please run database migration first.' 
        }, { status: 503 });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error creating parent organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
