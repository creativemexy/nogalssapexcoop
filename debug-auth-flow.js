const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugAuthFlow() {
  try {
    console.log('Debugging authentication flow...');
    
    const email = 'apexfund@nogalss.com';
    const password = 'ApexFunds123!@#Secure';
    
    // Step 1: Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    console.log('1. User found:', !!user);
    if (user) {
      console.log('   - Email:', user.email);
      console.log('   - Role:', user.role);
      console.log('   - isActive:', user.isActive);
      console.log('   - isVerified:', user.isVerified);
      console.log('   - hasPassword:', !!user.password);
    }
    
    if (!user) {
      console.log('User not found, stopping here');
      return;
    }
    
    // Step 2: Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('2. Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Password invalid, stopping here');
      return;
    }
    
    // Step 3: Check global 2FA setting
    const global2FASetting = await prisma.setting.findUnique({ 
      where: { key: 'global_2fa_enabled' } 
    });
    console.log('3. Global 2FA setting:', global2FASetting);
    const global2FAEnabled = global2FASetting?.value === 'true';
    console.log('   - Global 2FA enabled:', global2FAEnabled);
    
    if (global2FAEnabled) {
      console.log('4. Global 2FA is enabled, checking user 2FA status...');
      console.log('   - User 2FA enabled:', user.twoFactorEnabled);
      console.log('   - User has 2FA secret:', !!user.twoFactorSecret);
      
      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        console.log('   - User must have 2FA set up, but they don\'t - AUTH FAILED');
        return;
      }
    } else {
      console.log('4. Global 2FA is disabled, authentication should succeed');
    }
    
    console.log('✅ Authentication should succeed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuthFlow();
