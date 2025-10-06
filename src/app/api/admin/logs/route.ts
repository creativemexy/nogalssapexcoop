import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalCount = await prisma.log.count();

        // Get paginated logs
        const logs = await prisma.log.findMany({
            orderBy: {
                timestamp: 'desc',
            },
            skip,
            take: limit,
        });

        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            logs,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 