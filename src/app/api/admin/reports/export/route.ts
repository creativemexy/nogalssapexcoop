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
            const [users, cooperatives, transactions, loans, payments] = await Promise.all([
                prisma.user.findMany({
                    where: { createdAt: { gte: startDate } },
                    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true }
                }),
                prisma.cooperative.findMany({
                    where: { createdAt: { gte: startDate } },
                    select: { id: true, name: true, registrationNumber: true, city: true, createdAt: true }
                }),
                prisma.transaction.findMany({
                    where: { createdAt: { gte: startDate } },
                    select: { id: true, type: true, amount: true, status: true, createdAt: true }
                }),
                prisma.loan.findMany({
                    where: { createdAt: { gte: startDate } },
                    select: { id: true, amount: true, status: true, purpose: true, createdAt: true }
                }),
                prisma.payment.findMany({
                    where: { createdAt: { gte: startDate } },
                    select: { id: true, amount: true, status: true, createdAt: true }
                })
            ]);

            csvData = 'Type,Count,Total Amount\n';
            csvData += `Users,${users.length},0\n`;
            csvData += `Cooperatives,${cooperatives.length},0\n`;
            csvData += `Transactions,${transactions.length},${transactions.reduce((sum, t) => sum + Number(t.amount), 0)}\n`;
            csvData += `Loans,${loans.length},${loans.reduce((sum, l) => sum + Number(l.amount), 0)}\n`;
            csvData += `Payments,${payments.length},${payments.reduce((sum, p) => sum + Number(p.amount), 0)}\n`;

            filename = `overview-report-${new Date().toISOString().split('T')[0]}.csv`;
        } else if (type === 'detailed') {
            const users = await prisma.user.findMany({
                where: { createdAt: { gte: startDate } },
                include: {
                    cooperative: true,
                    contributions: true,
                    loans: true,
                    transactions: true
                }
            });

            csvData = 'User ID,Email,Name,Role,Cooperative,Contributions,Loans,Transactions,Created At\n';
            users.forEach(user => {
                const contributions = user.contributions.reduce((sum, c) => sum + Number(c.amount), 0);
                const loans = user.loans.reduce((sum, l) => sum + Number(l.amount), 0);
                const transactions = user.transactions.reduce((sum, t) => sum + Number(t.amount), 0);
                
                csvData += `${user.id},${user.email},${user.firstName} ${user.lastName},${user.role},${user.cooperative?.name || 'N/A'},${contributions},${loans},${transactions},${user.createdAt.toISOString()}\n`;
            });

            filename = `detailed-report-${new Date().toISOString().split('T')[0]}.csv`;
        }

        return new NextResponse(csvData, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error exporting report:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
