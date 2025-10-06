import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'overview';
        const range = searchParams.get('range') || '30';
        const days = parseInt(range);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        let csvData = '';
        let filename = '';

        if (type === 'overview') {
            // Overview report
            const [
                totalUsers,
                totalCooperatives,
                totalTransactions,
                totalLoans,
                activeLoans,
                pendingLoans
            ] = await Promise.all([
                prisma.user.count(),
                prisma.cooperative.count(),
                prisma.transaction.count(),
                prisma.loan.count(),
                prisma.loan.count({ where: { status: 'ACTIVE' } }),
                prisma.loan.count({ where: { status: 'PENDING' } })
            ]);

            csvData = `Metric,Value
Total Users,${totalUsers}
Total Cooperatives,${totalCooperatives}
Total Transactions,${totalTransactions}
Total Loans,${totalLoans}
Active Loans,${activeLoans}
Pending Loans,${pendingLoans}`;

            filename = 'overview-report';
        } else if (type === 'detailed') {
            // Detailed report with user data
            const users = await prisma.user.findMany({
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    isActive: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            });

            csvData = `First Name,Last Name,Email,Role,Status,Created At
${users.map(user => 
    `${user.firstName},${user.lastName},${user.email},${user.role},${user.isActive ? 'Active' : 'Inactive'},${user.createdAt.toISOString()}`
).join('\n')}`;

            filename = 'detailed-users-report';
        }

        const response = new NextResponse(csvData);
        response.headers.set('Content-Type', 'text/csv');
        response.headers.set('Content-Disposition', `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`);
        
        return response;
    } catch (error) {
        console.error('Error exporting report:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}