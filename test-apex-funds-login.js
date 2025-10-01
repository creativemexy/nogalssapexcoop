// Test APEX_FUNDS user login specifically
const testApexFundsLogin = async () => {
  try {
    console.log('🔍 Testing APEX_FUNDS user login specifically...\n');
    
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
    
    // Test 2: Try login as APEX_FUNDS user
    console.log('\n2️⃣ Attempting APEX_FUNDS login:');
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
    console.log('\n3️⃣ Checking session after login:');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const sessionData = await sessionResponse.json();
    console.log('   Session data:', sessionData);
    
    if (sessionData.user) {
      console.log('   ✅ User authenticated successfully');
      console.log('   User role:', sessionData.user.role);
      console.log('   User email:', sessionData.user.email);
      console.log('   User id:', sessionData.user.id);
    } else {
      console.log('   ❌ User not authenticated');
    }
    
    // Test 4: Test dashboard access
    console.log('\n4️⃣ Testing dashboard access:');
    const dashboardResponse = await fetch('http://localhost:3000/dashboard/apex-funds', {
      redirect: 'manual'
    });
    console.log('   Dashboard status:', dashboardResponse.status);
    console.log('   Dashboard URL:', dashboardResponse.url);
    
    if (dashboardResponse.status === 302 || dashboardResponse.status === 307) {
      const location = dashboardResponse.headers.get('location');
      console.log('   Redirect location:', location);
      
      if (location?.includes('unauthorized')) {
        console.log('   ❌ PROBLEM: Redirected to unauthorized');
        console.log('   💡 SOLUTION: Check middleware role detection');
      } else if (location?.includes('signin')) {
        console.log('   ❌ PROBLEM: Redirected to signin');
        console.log('   💡 SOLUTION: User not authenticated');
      }
    }
    
    // Test 5: Compare with working user
    console.log('\n5️⃣ Testing working user for comparison:');
    const workingLoginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'admin@nogalss.com',
        password: 'Admin123!@#Secure',
        csrfToken: csrfData.csrfToken,
        redirect: 'false'
      })
    });
    
    console.log('   Working user login status:', workingLoginResponse.status);
    
    const workingSessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const workingSessionData = await workingSessionResponse.json();
    console.log('   Working user session has user:', !!workingSessionData.user);
    
    console.log('\n🎯 COMPARISON:');
    console.log('   APEX_FUNDS login works:', !!sessionData.user);
    console.log('   Working user login works:', !!workingSessionData.user);
    
    if (!sessionData.user && workingSessionData.user) {
      console.log('   ❌ PROBLEM: APEX_FUNDS user specifically cannot authenticate');
      console.log('   💡 SOLUTION: Check NextAuth configuration for this specific user');
    } else if (!sessionData.user && !workingSessionData.user) {
      console.log('   ❌ PROBLEM: No users can authenticate - NextAuth is broken');
      console.log('   💡 SOLUTION: Fix NextAuth configuration');
    } else {
      console.log('   ✅ Authentication is working');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

testApexFundsLogin();