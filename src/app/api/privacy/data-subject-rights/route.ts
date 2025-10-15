import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import { DataEncryption } from '@/lib/data-encryption';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestType, description } = await request.json();
    const { ipAddress, userAgent } = AuditLogger.extractRequestInfo(request);

    if (!requestType || !description) {
      return NextResponse.json({ 
        error: 'Request type and description are required' 
      }, { status: 400 });
    }

    const validRequestTypes = ['access', 'rectification', 'erasure', 'portability', 'objection'];
    if (!validRequestTypes.includes(requestType)) {
      return NextResponse.json({ 
        error: 'Invalid request type' 
      }, { status: 400 });
    }

    // Create data subject request
    const dataSubjectRequest = await prisma.dataSubjectRequest.create({
      data: {
        dataSubjectId: (session.user as any).id,
        requestType,
        description,
        status: 'pending',
        requestedAt: new Date()
      }
    });

    // Log the request
    await AuditLogger.logDataSubjectRequest(
      (session.user as any).id,
      requestType,
      description,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      requestId: dataSubjectRequest.id,
      message: 'Your request has been submitted and will be processed within 30 days'
    });

  } catch (error: any) {
    console.error('Data subject request error:', error);
    return NextResponse.json({
      error: 'Failed to submit request'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestType = searchParams.get('type');

    // Get user's data subject requests
    const requests = await prisma.dataSubjectRequest.findMany({
      where: {
        dataSubjectId: (session.user as any).id,
        ...(requestType && { requestType })
      },
      orderBy: { requestedAt: 'desc' }
    });

    return NextResponse.json({ requests });

  } catch (error: any) {
    console.error('Failed to fetch data subject requests:', error);
    return NextResponse.json({
      error: 'Failed to fetch requests'
    }, { status: 500 });
  }
}
