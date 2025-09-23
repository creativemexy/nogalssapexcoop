import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { createLog } from '@/lib/logger';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { registrationType } = body;

        if (registrationType === 'COOPERATIVE') {
            const { 
                cooperativeName, cooperativeRegNo, bankName, bankAccountNumber, 
                address, city, lga, state, phone, cooperativeEmail,
                leaderFirstName, leaderLastName, leaderEmail, leaderPassword,
                leaderPhone, leaderTitle
            } = body;

            // Validate input for all required fields
            const requiredFields = {
                cooperativeName, cooperativeRegNo, bankName, bankAccountNumber,
                address, city, lga, state, phone,
                leaderFirstName, leaderLastName, leaderEmail, leaderPassword,
                leaderPhone, leaderTitle
            };

            for (const [key, value] of Object.entries(requiredFields)) {
                if (!value) {
                    return NextResponse.json({ error: `Field '${key}' is required.` }, { status: 400 });
                }
            }
            
            // Check if leader email is already in use
            const existingUser = await prisma.user.findUnique({ where: { email: leaderEmail } });
            if (existingUser) {
                return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
            }

            // Check if cooperative registration number is already in use
            const existingCooperative = await prisma.cooperative.findUnique({ where: { registrationNumber: cooperativeRegNo } });
            if (existingCooperative) {
                return NextResponse.json({ error: 'A co-operative with this registration number already exists.' }, { status: 409 });
            }

            // Use a transaction to ensure both cooperative and leader are created, or neither
            const result = await prisma.$transaction(async (tx) => {
                // Create Cooperative
                const cooperative = await tx.cooperative.create({
                    data: {
                        name: cooperativeName,
                        registrationNumber: cooperativeRegNo,
                        bankName,
                        bankAccountNumber,
                        address,
                        city,
                        lga,
                        state,
                        phoneNumber: phone,
                        email: cooperativeEmail || leaderEmail,
                    },
                });

                // Hash leader's password
                const hashedPassword = await bcrypt.hash(leaderPassword, 12);

                // Create Leader User
                const leaderUser = await tx.user.create({
                    data: {
                        firstName: leaderFirstName,
                        lastName: leaderLastName,
                        email: leaderEmail,
                        password: hashedPassword,
                        role: UserRole.LEADER,
                        cooperativeId: cooperative.id,
                        phoneNumber: leaderPhone,
                    },
                });

                // Create Leader record
                await tx.leader.create({
                    data: {
                        userId: leaderUser.id,
                        cooperativeId: cooperative.id,
                        title: leaderTitle,
                    },
                });

                return { cooperative, leaderUser };
            });
            
            return NextResponse.json({ message: `Co-operative '${result.cooperative.name}' and leader account created successfully. You can now sign in.` }, { status: 201 });

        } else if (registrationType === 'MEMBER') {
            const { firstName, lastName, email, password, cooperativeCode } = body;
            
            // Validate input
            if (!firstName || !lastName || !email || !password || !cooperativeCode) {
                return NextResponse.json({ error: 'All fields are required for member registration.' }, { status: 400 });
            }

            // Check if co-operative exists
            const cooperative = await prisma.cooperative.findUnique({ where: { registrationNumber: cooperativeCode } });
            if (!cooperative) {
                return NextResponse.json({ error: 'Invalid Co-operative Code. Please check the code and try again.' }, { status: 404 });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create Member User
            await prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    password: hashedPassword,
                    role: UserRole.MEMBER,
                    cooperativeId: cooperative.id,
                },
            });

            return NextResponse.json({ message: 'Member account created successfully. You can now sign in.' }, { status: 201 });
        } else {
            return NextResponse.json({ error: 'Invalid registration type.' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Registration error:', error);
        // Check for unique constraint violation
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
             return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
} 