// Test the complete authentication flow
const testAuthFlow = async () => {
  try {
    console.log('🔍 Testing complete authentication flow...\n');
    
    // Step 1: Check if user exists and is properly configured
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findFirst({
      where: { role: 'APEX_FUNDS' },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        twoFactorEnabled: true,
        password: true
      }
    });
    
    console.log('1️⃣ Database User Check:');
    console.log('   ✅ User exists:', !!user);
    if (user) {
      console.log('   📧 Email:', user.email);
      console.log('   👤 Role:', user.role);
      console.log('   ✅ Active:', user.isActive);
      console.log('   ✅ Verified:', user.isVerified);
      console.log('   🔐 2FA Enabled:', user.twoFactorEnabled);
      console.log('   🔑 Has Password:', !!user.password);
    }
    
    // Step 2: Check global 2FA setting
    const global2FA = await prisma.setting.findUnique({
      where: { key: 'global_2fa_enabled' }
    });
    
    console.log('\n2️⃣ Global 2FA Setting:');
    console.log('   🔒 Setting exists:', !!global2FA);
    console.log('   🔒 Value:', global2FA?.value);
    console.log('   🔒 Enabled:', global2FA?.value === 'true');
    
    await prisma.$disconnect();
    
    // Step 3: Test password verification
    console.log('\n3️⃣ Password Verification:');
    const bcrypt = require('bcryptjs');
    const testPassword = 'ApexFunds123!@#Secure';
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    console.log('   🔑 Password valid:', isPasswordValid);
    
    // Step 4: Test NextAuth login endpoint
    console.log('\n4️⃣ NextAuth Login Test:');
    
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: user.email,
        password: testPassword,
        redirect: 'false'
      })
    });
    
    console.log('   📡 Response Status:', loginResponse.status);
    console.log('   🔗 Response URL:', loginResponse.url);
    
    if (loginResponse.status === 200) {
      const responseText = await loginResponse.text();
      console.log('   📄 Response contains "error":', responseText.includes('error'));
      console.log('   📄 Response contains "success":', responseText.includes('success'));
      console.log('   📄 Response contains "signin":', responseText.includes('signin'));
    }
    
    // Step 5: Check session after login attempt
    console.log('\n5️⃣ Session Check:');
    
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const sessionData = await sessionResponse.json();
    
    console.log('   👤 Session has user:', !!sessionData.user);
    if (sessionData.user) {
      console.log('   📧 User email:', sessionData.user.email);
      console.log('   👤 User role:', sessionData.user.role);
    } else {
      console.log('   ❌ No user in session');
    }
    
    // Step 6: Test dashboard access
    console.log('\n6️⃣ Dashboard Access Test:');
    
    const dashboardResponse = await fetch('http://localhost:3000/dashboard/apex-funds', {
      redirect: 'manual'
    });
    
    console.log('   📡 Dashboard Status:', dashboardResponse.status);
    console.log('   🔗 Dashboard URL:', dashboardResponse.url);
    
    if (dashboardResponse.status === 302 || dashboardResponse.status === 307) {
      const location = dashboardResponse.headers.get('location');
      console.log('   🔄 Redirect to:', location);
      
      if (location?.includes('unauthorized')) {
        console.log('   ❌ REDIRECTED TO UNAUTHORIZED - This is the problem!');
      } else if (location?.includes('signin')) {
        console.log('   ❌ REDIRECTED TO SIGNIN - Authentication failed!');
      } else {
        console.log('   ✅ Redirect looks normal');
      }
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    if (!sessionData.user) {
      console.log('   ❌ PROBLEM: No user in session - authentication is failing');
      console.log('   💡 SOLUTION: Check NextAuth configuration and credentials provider');
    } else if (dashboardResponse.url?.includes('unauthorized')) {
      console.log('   ❌ PROBLEM: User authenticated but redirected to unauthorized');
      console.log('   💡 SOLUTION: Check middleware role detection');
    } else {
      console.log('   ✅ Authentication and redirect working correctly');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

testAuthFlow();
