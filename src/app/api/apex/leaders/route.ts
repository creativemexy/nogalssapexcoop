import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'APEX') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Apex users can see all leaders
    const leaders = await prisma.leader.findMany({
      include: {
        user: true,
        cooperative: true,
      },
    });

    const formatted = leaders.map(l => ({
      id: l.id,
      firstName: l.user?.firstName || '',
      lastName: l.user?.lastName || '',
      phone: l.user?.phoneNumber || '',
      email: l.user?.email || '',
      bankName: l.bankName || '',
      bankAccountNumber: l.bankAccountNumber || '',
      bankAccountName: l.bankAccountName || '',
      cooperative: l.cooperative?.name || '',
      status: l.isActive ? 'Active' : 'Inactive',
    }));

    return NextResponse.json({ leaders: formatted });
  } catch (e) {
    console.error('Error fetching leaders:', e);
    return NextResponse.json({ error: 'Failed to fetch leaders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'APEX') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { firstName, lastName, phone, email, bankName, bankAccountNumber, bankAccountName, cooperative } = await req.json();

    // Validate required fields
    if (!firstName || !lastName || !phone || !email || !bankName || !bankAccountNumber || !bankAccountName || !cooperative) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Find or create the cooperative
    let cooperativeRecord = await prisma.cooperative.findFirst({
      where: { name: cooperative },
    });

    if (!cooperativeRecord) {
      // Create a new cooperative if it doesn't exist
      cooperativeRecord = await prisma.cooperative.create({
        data: {
          name: cooperative,
          registrationNumber: `COOP-${Date.now()}`, // Generate a temporary registration number
          address: '', // These will need to be filled in later
          city: '',
          phoneNumber: '',
          email: '',
          bankName: '',
          bankAccountNumber: '',
          bankAccountName: '',
          description: '',
          isActive: true,
        },
      });
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber: phone,
        role: 'LEADER',
        isActive: true,
        isVerified: false,
        password: '', // Set a default or send invite to set password
      },
    });

    // Create the leader
    const leader = await prisma.leader.create({
      data: {
        userId: user.id,
        cooperativeId: cooperativeRecord.id,
        bankName,
        bankAccountNumber,
        bankAccountName,
        isActive: true,
      },
      include: {
        user: true,
        cooperative: true,
      },
    });

    return NextResponse.json({
      leader: {
        id: leader.id,
        firstName: leader.user.firstName,
        lastName: leader.user.lastName,
        phone: leader.user.phoneNumber,
        email: leader.user.email,
        bankName: leader.bankName,
        bankAccountNumber: leader.bankAccountNumber,
        bankAccountName: leader.bankAccountName,
        cooperative: leader.cooperative.name,
        status: leader.isActive ? 'Active' : 'Inactive',
      },
    });
  } catch (e) {
    console.error('Error creating leader:', e);
    return NextResponse.json({ error: 'Failed to create leader' }, { status: 500 });
  }
} 