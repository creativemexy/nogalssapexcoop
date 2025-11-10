import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createLog } from '@/lib/logger';
import { NotificationService, getWelcomeEmailHtml } from '@/lib/notifications';
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
    // For super admin, show all organizations (active and inactive)
    // For apex, only show active ones
    const where: any = {};
    
    // Only filter by isActive for APEX users, SUPER_ADMIN sees all
    if (userRole === 'APEX') {
      where.isActive = true;
    }

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
      // First, let's check if there are any organizations at all
      const totalCount = await prisma.parentOrganization.count({ where: {} });
      console.log(`Total parent organizations in database (no filters): ${totalCount}`);
      
      const whereCount = await prisma.parentOrganization.count({ where });
      console.log(`Parent organizations matching filters: ${whereCount}`, where);
      
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
      
      console.log(`Found ${organizations.length} parent organizations (total: ${total})`);
      if (organizations.length > 0) {
        console.log('Sample organization:', {
          id: organizations[0].id,
          name: organizations[0].name,
          isActive: organizations[0].isActive,
          createdBy: organizations[0].createdBy
        });
      }

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
        console.error('Parent organization table does not exist:', error.message);
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
      console.error('Error querying parent organizations:', error);
      throw error;
    }

  } catch (error: any) {
    console.error('Error fetching parent organizations:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
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

    // Get the actual user from database to ensure we have a valid ID
    const sessionUserEmail = session.user.email;
    if (!sessionUserEmail) {
      return NextResponse.json({ error: 'User email not found in session' }, { status: 401 });
    }

    const sessionUser = await prisma.user.findUnique({
      where: { email: sessionUserEmail },
      select: { id: true, role: true }
    });

    if (!sessionUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 401 });
    }

    // Double-check role from database
    if (sessionUser.role !== 'SUPER_ADMIN' && sessionUser.role !== 'APEX') {
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

    // Validate phone number format (11 digits) if provided
    if (contactPhone && !/^\d{11}$/.test(contactPhone)) {
      return NextResponse.json({ 
        error: 'Organization phone number must be exactly 11 digits (e.g., 08012345678)' 
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
          createdBy: sessionUser.id,
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
      let emailSent = false;
      let smsSent = false;

      try {
        // Send email notification using standardized welcome email template
        const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard/parent-organization`;
        const emailHtml = getWelcomeEmailHtml({
          name: name,
          email: contactEmail,
          password: defaultPassword,
          role: 'PARENT_ORGANIZATION',
          dashboardUrl: dashboardUrl,
        });

        console.log(`📧 Sending welcome email to parent organization: ${contactEmail}`);
        await NotificationService.sendEmail({
          to: contactEmail,
          subject: 'Welcome to Nogalss Parent Organization Dashboard',
          html: emailHtml,
        });
        emailSent = true;
        console.log(`✅ Welcome email sent successfully to ${contactEmail}`);

        // Send SMS notification if phone number is provided
        if (contactPhone) {
          const smsMessage = `Welcome to Nogalss! Your parent organization dashboard is ready. Login: ${contactEmail}, Password: ${defaultPassword}. Dashboard: ${dashboardUrl}`;
          
          console.log(`📱 Sending welcome SMS to parent organization: ${contactPhone}`);
          await NotificationService.sendSMS({
            to: contactPhone,
            message: smsMessage,
          });
          smsSent = true;
          console.log(`✅ Welcome SMS sent successfully to ${contactPhone}`);
        }
      } catch (notificationError) {
        console.error('❌ Error sending notifications:', notificationError);
        // Log the error but don't fail the organization creation
        // The organization is already created, so we just log the notification failure
        console.error('⚠️  Parent organization created but notifications failed:', {
          emailSent,
          smsSent,
          error: notificationError instanceof Error ? notificationError.message : 'Unknown error'
        });
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
