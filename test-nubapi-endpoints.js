const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNubAPIEndpoints() {
  try {
    console.log('🔍 Testing different NubAPI endpoints...\n');
    
    const baseUrl = 'https://nubapi.com';
    const endpoints = [
      '/verify',
      '/api/verify',
      '/v1/verify',
      '/v2/verify',
      '/account/verify',
      '/bank/verify',
      '/resolve',
      '/api/resolve',
      '/v1/resolve',
      '/v2/resolve',
      '/account/resolve',
      '/bank/resolve'
    ];
    
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${process.env.NUBAPI_KEY}`
    };
    
    for (const endpoint of endpoints) {
      try {
        const url = `${baseUrl}${endpoint}?account_number=2141002549&bank_code=000004`;
        console.log(`Testing: ${endpoint}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers
        });
        
        console.log(`  Status: ${response.status} ${response.statusText}`);
        
        if (response.status !== 404) {
          const data = await response.text();
          console.log(`  Response: ${data.substring(0, 200)}...`);
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`  Error: ${error.message}`);
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNubAPIEndpoints();




