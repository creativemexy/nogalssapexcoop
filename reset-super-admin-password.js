const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function resetSuperAdminPassword() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔐 Resetting Super Admin Password...\n');
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL environment variable is not set');
      console.log('Please set up your database connection first.');
      return;
    }

    const newPassword = 'Admin123!@#Secure';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update super admin password and ensure account is active
    const result = await prisma.user.updateMany({
      where: {
        role: 'SUPER_ADMIN'
      },
      data: {
        password: hashedPassword,
        isActive: true,
        isVerified: true
      }
    });

    if (result.count > 0) {
      console.log('✅ Super admin password reset successfully!');
      console.log('\n🔐 Updated Login Credentials:');
      console.log('Email: admin@nogalss.com');
      console.log('Password:', newPassword);
      console.log('\n📊 Updated', result.count, 'super admin account(s)');
      console.log('\n⚠️  Please change the password after logging in for additional security!');
    } else {
      console.log('❌ No super admin accounts found to reset');
      console.log('💡 Run "node create-super-admin.js" to create a new super admin');
    }
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Database connection failed. Please check:');
      console.log('- Database server is running');
      console.log('- DATABASE_URL is correct');
      console.log('- Network connectivity');
    }
  } finally {
    await prisma.$disconnect();
  }
}

resetSuperAdminPassword();