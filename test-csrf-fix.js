// Test CSRF token fix
const testCSRFFix = async () => {
  try {
    console.log('🔍 Testing CSRF token fix...\n');
    
    // Get fresh CSRF token
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    console.log('1️⃣ CSRF Token:', csrfData.csrfToken);
    
    // Test login with different formats
    const formats = [
      // Format 1: Standard NextAuth format
      {
        name: 'Standard NextAuth',
        body: new URLSearchParams({
          email: 'apexfund@nogalss.com',
          password: 'ApexFunds123!@#Secure',
          csrfToken: csrfData.csrfToken,
          callbackUrl: 'http://localhost:3000/dashboard',
          json: 'true'
        })
      },
      // Format 2: Without json parameter
      {
        name: 'Without json parameter',
        body: new URLSearchParams({
          email: 'apexfund@nogalss.com',
          password: 'ApexFunds123!@#Secure',
          csrfToken: csrfData.csrfToken,
          callbackUrl: 'http://localhost:3000/dashboard'
        })
      },
      // Format 3: With redirect false
      {
        name: 'With redirect false',
        body: new URLSearchParams({
          email: 'apexfund@nogalss.com',
          password: 'ApexFunds123!@#Secure',
          csrfToken: csrfData.csrfToken,
          redirect: 'false'
        })
      }
    ];
    
    for (const format of formats) {
      console.log(`\n2️⃣ Testing ${format.name}:`);
      
      const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: format.body
      });
      
      console.log(`   Status: ${response.status}`);
      console.log(`   URL: ${response.url}`);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log(`   Response: ${responseText.substring(0, 100)}`);
        
        // Check if it's a success response
        if (responseText.includes('"url"') && responseText.includes('signin')) {
          console.log('   ❌ Still redirecting to signin');
        } else {
          console.log('   ✅ Potential success!');
        }
      }
    }
    
    // Test 4: Check if the issue is with the user data
    console.log('\n3️⃣ Testing user data validation:');
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findFirst({
      where: { role: 'APEX_FUNDS' },
      select: {
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        password: true
      }
    });
    
    console.log('   User exists:', !!user);
    console.log('   User active:', user?.isActive);
    console.log('   User verified:', user?.isVerified);
    console.log('   User role:', user?.role);
    
    // Test password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare('ApexFunds123!@#Secure', user.password);
    console.log('   Password valid:', isPasswordValid);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

testCSRFFix();
