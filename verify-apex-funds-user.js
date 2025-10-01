const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyApexFundsUser() {
  try {
    console.log('Verifying APEX_FUNDS user...');
    
    const user = await prisma.user.findFirst({
      where: {
        role: 'APEX_FUNDS'
      }
    });
    
    if (user) {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          isActive: true
        }
      });
      
      console.log('Updated APEX_FUNDS user:', {
        email: updatedUser.email,
        isVerified: updatedUser.isVerified,
        isActive: updatedUser.isActive,
        role: updatedUser.role
      });
    } else {
      console.log('No APEX_FUNDS user found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyApexFundsUser();
