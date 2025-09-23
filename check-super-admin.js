const { PrismaClient } = require('@prisma/client');

async function checkSuperAdmin() {
  const prisma = new PrismaClient();
  
  try {
    // Check for SUPER_ADMIN users
    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    });

    console.log('SUPER_ADMIN users found:', superAdmins.length);
    console.log(JSON.stringify(superAdmins, null, 2));

    // Also check all users to see what roles exist
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    console.log('\nAll users in database:');
    console.log(JSON.stringify(allUsers, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin();
