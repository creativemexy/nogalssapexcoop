// Debug script to test APEX_FUNDS user login and redirect
const testApexFundsLogin = async () => {
  try {
    console.log('Testing APEX_FUNDS user login...');
    
    // Test login
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'apexfunds@nogalss.org',
        password: 'ApexFunds123!@#Secure',
        redirect: 'false'
      })
    });
    
    console.log('Login response status:', loginResponse.status);
    console.log('Login response headers:', Object.fromEntries(loginResponse.headers.entries()));
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('Login data:', loginData);
    } else {
      const errorText = await loginResponse.text();
      console.log('Login error:', errorText);
    }
    
    // Test session
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    console.log('Session response status:', sessionResponse.status);
    
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('Session data:', sessionData);
    } else {
      const sessionError = await sessionResponse.text();
      console.log('Session error:', sessionError);
    }
    
    // Test dashboard redirect
    const dashboardResponse = await fetch('http://localhost:3000/dashboard');
    console.log('Dashboard response status:', dashboardResponse.status);
    console.log('Dashboard response URL:', dashboardResponse.url);
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

testApexFundsLogin();
