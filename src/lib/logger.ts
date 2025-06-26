import { prisma } from './prisma';
import { UserRole } from '@prisma/client';
import { Session } from 'next-auth';

interface LogData {
    action: string;
    user: Session['user'];
}

export const createLog = async ({ action, user }: LogData) => {
    if (!user || !user.id || !user.email) {
        // Cannot log without user information
        return;
    }

    // Exclude SUPER_ADMIN from logging
    if (user.role === UserRole.SUPER_ADMIN) {
        return;
    }

    try {
        await prisma.log.create({
            data: {
                action,
                userId: user.id,
                userEmail: user.email,
            },
        });
    } catch (error) {
        console.error('Failed to create log:', error);
    }
}; 