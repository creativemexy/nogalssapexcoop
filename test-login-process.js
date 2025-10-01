// Test the complete login process
const testLoginProcess = async () => {
  try {
    console.log('🔍 Testing complete login process...\n');
    
    // Test 1: Get CSRF token
    console.log('1️⃣ Getting CSRF token:');
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    let csrfData;
    try {
      csrfData = await csrfResponse.json();
      console.log('   CSRF token:', csrfData.csrfToken ? 'Present' : 'Missing');
    } catch (error) {
      console.log('   CSRF token: ERROR -', error.message);
      return;
    }
    
    // Test 2: Try login
    console.log('\n2️⃣ Attempting login:');
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'apexfund@nogalss.com',
        password: 'ApexFunds123!@#Secure',
        csrfToken: csrfData.csrfToken,
        redirect: 'false'
      })
    });
    
    console.log('   Login status:', loginResponse.status);
    console.log('   Login URL:', loginResponse.url);
    
    // Test 3: Check session immediately after login
    console.log('\n3️⃣ Checking session after login:');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const sessionData = await sessionResponse.json();
    console.log('   Session data:', sessionData);
    
    if (sessionData.user) {
      console.log('   ✅ User authenticated successfully');
      console.log('   User role:', sessionData.user.role);
      console.log('   User email:', sessionData.user.email);
    } else {
      console.log('   ❌ User not authenticated');
    }
    
    // Test 4: Check if the issue is with cookies
    console.log('\n4️⃣ Checking cookies:');
    const cookies = loginResponse.headers.get('set-cookie');
    if (cookies) {
      console.log('   Cookies set:', cookies.split(',').length, 'cookies');
    } else {
      console.log('   ❌ No cookies set');
    }
    
    // Test 5: Check if the issue is with the NextAuth configuration
    console.log('\n5️⃣ Testing NextAuth configuration:');
    const providersResponse = await fetch('http://localhost:3000/api/auth/providers');
    let providersData;
    try {
      providersData = await providersResponse.json();
      console.log('   Providers available:', Object.keys(providersData));
    } catch (error) {
      console.log('   Providers: ERROR -', error.message);
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    if (!sessionData.user) {
      console.log('   ❌ PROBLEM: Authentication is not working');
      console.log('   💡 SOLUTION: Check NextAuth configuration and server logs');
    } else {
      console.log('   ✅ Authentication is working');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

testLoginProcess();


