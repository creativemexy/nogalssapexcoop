const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNubAPI() {
  try {
    console.log('🔍 Testing NubAPI integration...\n');
    
    // Test with UBA (000004)
    const ubaUrl = 'https://nubapi.com/verify?account_number=2141002549&bank_code=000004';
    console.log('Testing UBA:', ubaUrl);
    
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${process.env.NUBAPI_KEY}`
    };
    
    console.log('Headers:', { ...headers, Authorization: 'Bearer [REDACTED]' });
    
    const response = await fetch(ubaUrl, {
      method: 'GET',
      headers
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log('Response body:', data);
    
    if (response.ok) {
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON:', jsonData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNubAPI();




