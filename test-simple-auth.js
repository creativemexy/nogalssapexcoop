// Simple authentication test
const testSimpleAuth = async () => {
  try {
    console.log('🔍 Testing simple authentication...\n');
    
    // Test 1: Check if NextAuth is working
    console.log('1️⃣ Testing NextAuth endpoints:');
    
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    console.log('   Session status:', sessionResponse.status);
    const sessionData = await sessionResponse.json();
    console.log('   Session data:', sessionData);
    
    // Test 2: Check if we can get CSRF token
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    console.log('   CSRF token:', csrfData.csrfToken ? 'Present' : 'Missing');
    
    // Test 3: Try to login with the exact same format as the browser
    console.log('\n2️⃣ Testing login with browser format:');
    
    const loginFormData = new URLSearchParams({
      email: 'apexfund@nogalss.com',
      password: 'ApexFunds123!@#Secure',
      csrfToken: csrfData.csrfToken,
      callbackUrl: 'http://localhost:3000/dashboard',
      json: 'true'
    });
    
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: loginFormData
    });
    
    console.log('   Login status:', loginResponse.status);
    console.log('   Login URL:', loginResponse.url);
    
    if (loginResponse.ok) {
      const loginText = await loginResponse.text();
      console.log('   Login response type:', typeof loginText);
      console.log('   Login response (first 100 chars):', loginText.substring(0, 100));
      
      // Try to parse as JSON
      try {
        const loginJson = JSON.parse(loginText);
        console.log('   Login JSON:', loginJson);
      } catch (e) {
        console.log('   Login response is not JSON');
      }
    }
    
    // Test 4: Check session after login attempt
    console.log('\n3️⃣ Checking session after login:');
    const newSessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const newSessionData = await newSessionResponse.json();
    console.log('   Session has user:', !!newSessionData.user);
    if (newSessionData.user) {
      console.log('   User role:', newSessionData.user.role);
      console.log('   User email:', newSessionData.user.email);
    }
    
    // Test 5: Test dashboard access
    console.log('\n4️⃣ Testing dashboard access:');
    const dashboardResponse = await fetch('http://localhost:3000/dashboard/apex-funds', {
      redirect: 'manual'
    });
    console.log('   Dashboard status:', dashboardResponse.status);
    console.log('   Dashboard URL:', dashboardResponse.url);
    
    if (dashboardResponse.status === 302 || dashboardResponse.status === 307) {
      const location = dashboardResponse.headers.get('location');
      console.log('   Redirect location:', location);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

testSimpleAuth();
