// Test specific user authentication
const testSpecificUser = async () => {
  try {
    console.log('🔍 Testing specific user authentication...\n');
    
    // Test 1: Get CSRF token
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    let csrfData;
    try {
      csrfData = await csrfResponse.json();
    } catch (error) {
      console.log('   CSRF token: ERROR -', error.message);
      return;
    }
    console.log('   CSRF token:', csrfData.csrfToken ? 'Present' : 'Missing');
    
    // Test 2: Try logging in as APEX_FUNDS user specifically
    console.log('\n1️⃣ Testing APEX_FUNDS user login:');
    
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
    
    // Test 3: Check session after login
    console.log('\n2️⃣ Checking session after login:');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const sessionData = await sessionResponse.json();
    console.log('   Session has user:', !!sessionData.user);
    if (sessionData.user) {
      console.log('   User role:', sessionData.user.role);
      console.log('   User email:', sessionData.user.email);
      console.log('   User id:', sessionData.user.id);
    }
    
    // Test 4: Test dashboard access
    console.log('\n3️⃣ Testing dashboard access:');
    const dashboardResponse = await fetch('http://localhost:3000/dashboard/apex-funds', {
      redirect: 'manual'
    });
    console.log('   Dashboard status:', dashboardResponse.status);
    console.log('   Dashboard URL:', dashboardResponse.url);
    
    if (dashboardResponse.status === 302 || dashboardResponse.status === 307) {
      const location = dashboardResponse.headers.get('location');
      console.log('   Redirect location:', location);
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    if (!sessionData.user) {
      console.log('   ❌ PROBLEM: No user in session - authentication failed');
      console.log('   💡 SOLUTION: Check NextAuth configuration and server logs');
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

testSpecificUser();
