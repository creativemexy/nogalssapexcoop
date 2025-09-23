import { prisma } from './prisma';
import { UserRole } from '@prisma/client';
import { Session } from 'next-auth';

interface LogData {
    action: string;
    user: Session['user'];
}

export const createLog = async ({ action, user }: LogData) => {
    // Check for required user properties safely
    const userId = (user as any)?.id;
    const userEmail = user?.email;
    if (!user || !userId || !userEmail) {
        // Cannot log without user information
        return;
    }

    // Exclude SUPER_ADMIN from logging
    if ((user as any)?.role === UserRole.SUPER_ADMIN) {
        return;
    }

    try {
        await prisma.log.create({
            data: {
                action,
                userId: (user as any).id,
                userEmail: user.email,
                type: 'INFO', // or another appropriate default type
            },
        });
    } catch (error) {
        console.error('Failed to create log:', error);
    }
}; 