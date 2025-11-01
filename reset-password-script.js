const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    console.log('🔧 Password Reset Script for Nogalss Cooperative');
    console.log('================================================');
    
    // Get email from command line argument or use default
    const email = process.argv[2] || 'michaelike83@gmail.com';
    const newPassword = process.argv[3] || 'NewPassword123!';
    
    console.log(`📧 Looking up user: ${email}`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      console.log('\n💡 Available users:');
      
      const allUsers = await prisma.user.findMany({
        select: { email: true, firstName: true, lastName: true }
      });
      
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.firstName} ${u.lastName})`);
      });
      
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });
    
    // Generate new password hash
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    // Log the password reset
    await prisma.log.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: `Password reset via script for user ${user.email}`
      }
    });
    
    console.log('\n✅ PASSWORD RESET SUCCESSFUL!');
    console.log('==============================');
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 New Password: ${newPassword}`);
    console.log(`👤 Name: ${user.firstName} ${user.lastName}`);
    
    console.log('\n📝 Login Instructions:');
    console.log('1. Go to: https://nogalssapexcoop.org/auth/signin');
    console.log(`2. Email: ${user.email}`);
    console.log(`3. Password: ${newPassword}`);
    console.log('4. Click "Sign In"');
    
    console.log('\n🔒 Security Note:');
    console.log('- Please change this password after logging in');
    console.log('- This password reset has been logged in the system');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Usage instructions
if (process.argv.length < 2) {
  console.log('🔧 Password Reset Script');
  console.log('========================');
  console.log('');
  console.log('Usage:');
  console.log('  node reset-password-script.js [email] [new-password]');
  console.log('');
  console.log('Examples:');
  console.log('  node reset-password-script.js');
  console.log('  node reset-password-script.js user@example.com');
  console.log('  node reset-password-script.js user@example.com MyNewPassword123!');
  console.log('');
  console.log('Default:');
  console.log('  Email: michaelike83@gmail.com');
  console.log('  Password: NewPassword123!');
  console.log('');
} else {
  resetPassword();
}
