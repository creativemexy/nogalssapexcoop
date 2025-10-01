// Test NextAuth directly
const testNextAuthDirect = async () => {
  try {
    console.log('🔍 Testing NextAuth directly...\n');
    
    // Test the NextAuth session endpoint
    console.log('1️⃣ Testing /api/auth/session:');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    console.log('   Status:', sessionResponse.status);
    const sessionData = await sessionResponse.json();
    console.log('   Data:', sessionData);
    
    // Test the NextAuth providers endpoint
    console.log('\n2️⃣ Testing /api/auth/providers:');
    const providersResponse = await fetch('http://localhost:3000/api/auth/providers');
    console.log('   Status:', providersResponse.status);
    const providersData = await providersResponse.json();
    console.log('   Data:', providersData);
    
    // Test the NextAuth csrf endpoint
    console.log('\n3️⃣ Testing /api/auth/csrf:');
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    console.log('   Status:', csrfResponse.status);
    const csrfData = await csrfResponse.json();
    console.log('   Data:', csrfData);
    
    // Test login with proper NextAuth format
    console.log('\n4️⃣ Testing NextAuth login with proper format:');
    
    // First get CSRF token
    const csrfToken = csrfData.csrfToken;
    console.log('   CSRF Token:', csrfToken);
    
    // Test login with CSRF token
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'apexfund@nogalss.com',
        password: 'ApexFunds123!@#Secure',
        csrfToken: csrfToken,
        redirect: 'false'
      })
    });
    
    console.log('   Login Status:', loginResponse.status);
    console.log('   Login URL:', loginResponse.url);
    
    if (loginResponse.ok) {
      const loginText = await loginResponse.text();
      console.log('   Login Response (first 200 chars):', loginText.substring(0, 200));
    }
    
    // Check session after login
    console.log('\n5️⃣ Checking session after login:');
    const newSessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const newSessionData = await newSessionResponse.json();
    console.log('   Session has user:', !!newSessionData.user);
    if (newSessionData.user) {
      console.log('   User role:', newSessionData.user.role);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

testNextAuthDirect();
