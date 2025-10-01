// Debug session and authentication
const debugSession = async () => {
  try {
    console.log('🔍 Debugging session and authentication...\n');
    
    // Test 1: Check current session
    console.log('1️⃣ Current session:');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const sessionData = await sessionResponse.json();
    console.log('   Session data:', sessionData);
    
    if (sessionData.user) {
      console.log('   ✅ User is logged in');
      console.log('   User role:', sessionData.user.role);
      console.log('   User email:', sessionData.user.email);
      console.log('   User id:', sessionData.user.id);
    } else {
      console.log('   ❌ No user in session');
    }
    
    // Test 2: Check if the issue is with the middleware
    console.log('\n2️⃣ Testing middleware logic:');
    
    // Simulate the middleware role check
    const userRole = sessionData.user?.role;
    const isApexFunds = userRole === 'APEX_FUNDS';
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    
    console.log('   User role:', userRole);
    console.log('   Is APEX_FUNDS:', isApexFunds);
    console.log('   Is SUPER_ADMIN:', isSuperAdmin);
    
    // Test 3: Check dashboard access
    console.log('\n3️⃣ Testing dashboard access:');
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
    
    // Test 4: Check if the issue is with the token
    console.log('\n4️⃣ Testing token details:');
    if (sessionData.user) {
      console.log('   Token has role:', !!sessionData.user.role);
      console.log('   Token has id:', !!sessionData.user.id);
      console.log('   Token has email:', !!sessionData.user.email);
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    if (!sessionData.user) {
      console.log('   ❌ PROBLEM: No user in session - authentication failed');
      console.log('   💡 SOLUTION: Check NextAuth configuration');
    } else if (dashboardResponse.url?.includes('unauthorized')) {
      console.log('   ❌ PROBLEM: User authenticated but middleware rejected access');
      console.log('   💡 SOLUTION: Check middleware role detection logic');
    } else {
      console.log('   ✅ Authentication and access working correctly');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
};

debugSession();