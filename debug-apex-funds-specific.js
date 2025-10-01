// Debug APEX_FUNDS user specifically
const debugApexFundsSpecific = async () => {
  try {
    console.log('🔍 Debugging APEX_FUNDS user specifically...\n');
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Check APEX_FUNDS user details
    console.log('1️⃣ APEX_FUNDS User Details:');
    const apexFundsUser = await prisma.user.findFirst({
      where: { role: 'APEX_FUNDS' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        twoFactorEnabled: true,
        password: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (apexFundsUser) {
      console.log('   User found:', {
        id: apexFundsUser.id,
        email: apexFundsUser.email,
        name: `${apexFundsUser.firstName} ${apexFundsUser.lastName}`,
        role: apexFundsUser.role,
        isActive: apexFundsUser.isActive,
        isVerified: apexFundsUser.isVerified,
        twoFactorEnabled: apexFundsUser.twoFactorEnabled,
        hasPassword: !!apexFundsUser.password,
        createdAt: apexFundsUser.createdAt,
        updatedAt: apexFundsUser.updatedAt
      });
    } else {
      console.log('   ❌ APEX_FUNDS user not found!');
    }
    
    // Check other working users for comparison
    console.log('\n2️⃣ Working Users for Comparison:');
    const workingUsers = await prisma.user.findMany({
      where: { 
        role: { not: 'APEX_FUNDS' },
        isActive: true
      },
      select: {
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        twoFactorEnabled: true
      },
      take: 3
    });
    
    console.log('   Working users:');
    workingUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role}): active=${user.isActive}, verified=${user.isVerified}, 2fa=${user.twoFactorEnabled}`);
    });
    
    // Test password verification specifically
    console.log('\n3️⃣ Testing Password Verification:');
    if (apexFundsUser && apexFundsUser.password) {
      const bcrypt = require('bcryptjs');
      const testPassword = 'ApexFunds123!@#Secure';
      const isPasswordValid = await bcrypt.compare(testPassword, apexFundsUser.password);
      console.log('   Password verification result:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('   ❌ PASSWORD MISMATCH - This is the issue!');
        console.log('   💡 SOLUTION: Reset the password for this user');
      } else {
        console.log('   ✅ Password is correct');
      }
    } else {
      console.log('   ❌ No password found for APEX_FUNDS user');
    }
    
    // Check for any specific issues
    console.log('\n4️⃣ Potential Issues:');
    if (apexFundsUser) {
      const issues = [];
      
      if (!apexFundsUser.isActive) {
        issues.push('User is not active');
      }
      
      if (!apexFundsUser.isVerified) {
        issues.push('User is not verified');
      }
      
      if (apexFundsUser.twoFactorEnabled) {
        issues.push('User has 2FA enabled (might cause issues)');
      }
      
      if (!apexFundsUser.password) {
        issues.push('User has no password');
      }
      
      if (issues.length > 0) {
        console.log('   ❌ Issues found:');
        issues.forEach(issue => console.log(`   - ${issue}`));
      } else {
        console.log('   ✅ No obvious issues found');
      }
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
};

debugApexFundsSpecific();


