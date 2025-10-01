// Debug middleware role detection
const debugMiddlewareRole = async () => {
  try {
    console.log('🔍 Debugging middleware role detection...\n');
    
    // Test 1: Check what role is being detected in the session
    console.log('1️⃣ Checking session role:');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const sessionData = await sessionResponse.json();
    console.log('   Session data:', sessionData);
    
    if (sessionData.user) {
      console.log('   User role:', sessionData.user.role);
      console.log('   User email:', sessionData.user.email);
      console.log('   User id:', sessionData.user.id);
      
      // Test 2: Check if the role matches what we expect
      const expectedRole = 'APEX_FUNDS';
      const actualRole = sessionData.user.role;
      console.log('   Expected role:', expectedRole);
      console.log('   Actual role:', actualRole);
      console.log('   Role match:', actualRole === expectedRole);
      
      if (actualRole !== expectedRole) {
        console.log('   ❌ PROBLEM: Role mismatch!');
        console.log('   💡 SOLUTION: Check NextAuth JWT callback');
      } else {
        console.log('   ✅ Role is correct');
      }
    } else {
      console.log('   ❌ No user in session');
    }
    
    // Test 3: Check if the issue is with the middleware logic
    console.log('\n2️⃣ Testing middleware logic:');
    if (sessionData.user) {
      const userRole = sessionData.user.role;
      const isApexFunds = userRole === 'APEX_FUNDS';
      const isSuperAdmin = userRole === 'SUPER_ADMIN';
      
      console.log('   User role:', userRole);
      console.log('   Is APEX_FUNDS:', isApexFunds);
      console.log('   Is SUPER_ADMIN:', isSuperAdmin);
      
      // Test the exact middleware logic
      const pathname = '/dashboard/apex-funds';
      const shouldAllow = isApexFunds || isSuperAdmin;
      console.log('   Pathname:', pathname);
      console.log('   Should allow access:', shouldAllow);
      
      if (!shouldAllow) {
        console.log('   ❌ PROBLEM: Middleware logic is rejecting access');
        console.log('   💡 SOLUTION: Check role detection in middleware');
      } else {
        console.log('   ✅ Middleware logic should allow access');
      }
    }
    
    // Test 4: Check if the issue is with the NextAuth JWT callback
    console.log('\n3️⃣ Testing NextAuth JWT callback:');
    if (sessionData.user) {
      console.log('   JWT token has role:', !!sessionData.user.role);
      console.log('   JWT token has id:', !!sessionData.user.id);
      console.log('   JWT token has email:', !!sessionData.user.email);
      
      if (!sessionData.user.role) {
        console.log('   ❌ PROBLEM: JWT token missing role');
        console.log('   💡 SOLUTION: Check NextAuth JWT callback');
      } else {
        console.log('   ✅ JWT token has role');
      }
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    if (!sessionData.user) {
      console.log('   ❌ PROBLEM: No user in session - authentication failed');
      console.log('   💡 SOLUTION: Check NextAuth configuration');
    } else if (sessionData.user.role !== 'APEX_FUNDS') {
      console.log('   ❌ PROBLEM: Wrong role in session');
      console.log('   💡 SOLUTION: Check NextAuth JWT callback');
    } else {
      console.log('   ✅ User and role are correct - issue is elsewhere');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
};

debugMiddlewareRole();


