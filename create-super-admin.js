const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
  const prisma = new PrismaClient();
  
  try {
    // Create SUPER_ADMIN user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const superAdmin = await prisma.user.create({
      data: {
        email: 'admin@nogalss.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        phoneNumber: '08000000000'
      }
    });

    console.log('SUPER_ADMIN user created successfully:');
    console.log('Email: admin@nogalss.com');
    console.log('Password: admin123');
    console.log('User ID:', superAdmin.id);

  } catch (error) {
    console.error('Error creating SUPER_ADMIN:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
