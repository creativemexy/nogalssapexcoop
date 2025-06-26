import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Check if super admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'SUPER_ADMIN'
      }
    });

    if (existingAdmin) {
      console.log('Super admin already exists:', existingAdmin.email);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create super admin user
    const superAdmin = await prisma.user.create({
      data: {
        email: 'admin@nogalss.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        phoneNumber: '+2341234567890',
        role: 'SUPER_ADMIN',
        isActive: true,
        isVerified: true,
        address: 'Nogalss Headquarters',
      }
    });

    console.log('✅ Super Admin created successfully!');
    console.log('Email:', superAdmin.email);
    console.log('Password: admin123');
    console.log('Role:', superAdmin.role);
    console.log('\n⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin(); 