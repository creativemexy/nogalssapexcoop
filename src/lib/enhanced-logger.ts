import { prisma } from './prisma';
import { UserRole } from '@prisma/client';
import { Session } from 'next-auth';

interface LogData {
    action: string;
    user: Session['user'];
    details?: string;
    metadata?: Record<string, any>;
}

export const createLog = async ({ action, user, details, metadata }: LogData) => {
    // Type guard to ensure user has id and email
    const hasIdAndEmail = typeof (user as any)?.id === 'string' && typeof (user as any)?.email === 'string';
    if (!user || !hasIdAndEmail) {
        // Cannot log without user information
        return;
    }

    // Exclude SUPER_ADMIN from logging their own actions
    if ((user as any)?.role === UserRole.SUPER_ADMIN) {
        return;
    }

    try {
        await prisma.log.create({
            data: {
                action: details ? `${action}: ${details}` : action,
                userId: (user as any).id,
                userEmail: (user as any).email,
                type: 'INFO', // or another default type as required by your Log model
                ...(metadata && { metadata }),
            },
        });
    } catch (error) {
        console.error('Failed to create log:', error);
    }
};

// Specific logging functions for common actions
export const logUserRegistration = async (user: Session['user'], registrationType: string, details?: string) => {
    await createLog({
        action: `User registered as ${registrationType}`,
        user,
        details
    });
};

export const logPasswordChange = async (user: Session['user']) => {
    await createLog({
        action: 'Password changed',
        user
    });
};

export const logPayment = async (user: Session['user'], amount: number, currency: string = 'NGN', status: string) => {
    await createLog({
        action: `Payment ${status}`,
        user,
        details: `${currency} ${amount.toLocaleString()}`
    });
};

export const logLoanApplication = async (user: Session['user'], amount: number, status: string) => {
    await createLog({
        action: `Loan application ${status}`,
        user,
        details: `NGN ${amount.toLocaleString()}`
    });
};

export const logCooperativeRegistration = async (user: Session['user'], cooperativeName: string, regNumber: string) => {
    await createLog({
        action: 'Cooperative registered',
        user,
        details: `${cooperativeName} (${regNumber})`
    });
};

export const logLogin = async (user: Session['user']) => {
    await createLog({
        action: 'User logged in',
        user
    });
};

export const logLogout = async (user: Session['user']) => {
    await createLog({
        action: 'User logged out',
        user
    });
}; 