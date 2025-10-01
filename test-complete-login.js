// Complete login test for APEX_FUNDS user
const testCompleteLogin = async () => {
  try {
    console.log('Testing complete login process for APEX_FUNDS user...');
    
    // Step 1: Check if user exists in database
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findFirst({
      where: { role: 'APEX_FUNDS' },
      select: {
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        twoFactorEnabled: true
      }
    });
    
    console.log('1. Database user check:');
    console.log('   - User exists:', !!user);
    if (user) {
      console.log('   - Email:', user.email);
      console.log('   - Role:', user.role);
      console.log('   - Active:', user.isActive);
      console.log('   - Verified:', user.isVerified);
      console.log('   - 2FA Enabled:', user.twoFactorEnabled);
    }
    
    await prisma.$disconnect();
    
    // Step 2: Test login via NextAuth
    console.log('\n2. Testing NextAuth login...');
    
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'apexfund@nogalss.com',
        password: 'ApexFunds123!@#Secure',
        redirect: 'false'
      })
    });
    
    console.log('   - Login response status:', loginResponse.status);
    console.log('   - Login response URL:', loginResponse.url);
    
    if (loginResponse.ok) {
      const responseText = await loginResponse.text();
      console.log('   - Response contains "error":', responseText.includes('error'));
      console.log('   - Response contains "success":', responseText.includes('success'));
    }
    
    // Step 3: Check session after login attempt
    console.log('\n3. Checking session after login...');
    
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const sessionData = await sessionResponse.json();
    
    console.log('   - Session has user:', !!sessionData.user);
    if (sessionData.user) {
      console.log('   - User role:', sessionData.user.role);
      console.log('   - User email:', sessionData.user.email);
    }
    
    // Step 4: Test dashboard access
    console.log('\n4. Testing dashboard access...');
    
    const dashboardResponse = await fetch('http://localhost:3000/dashboard/apex-funds', {
      redirect: 'manual'
    });
    
    console.log('   - Dashboard response status:', dashboardResponse.status);
    console.log('   - Dashboard response URL:', dashboardResponse.url);
    
    if (dashboardResponse.status === 302 || dashboardResponse.status === 307) {
      const location = dashboardResponse.headers.get('location');
      console.log('   - Redirect location:', location);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

testCompleteLogin();
