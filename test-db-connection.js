// Test database connection in NextAuth context
const testDbConnection = async () => {
  try {
    console.log('🔍 Testing database connection in NextAuth context...\n');
    
    // Test 1: Direct database connection
    console.log('1️⃣ Testing direct database connection:');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: 'apexfund@nogalss.com'
        }
      });
      
      console.log('   Database connection: OK');
      console.log('   User found:', !!user);
      if (user) {
        console.log('   User details:', {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          isVerified: user.isVerified,
          hasPassword: !!user.password
        });
      }
    } catch (error) {
      console.log('   Database connection: ERROR -', error.message);
    } finally {
      await prisma.$disconnect();
    }
    
    // Test 2: Test the exact same query that NextAuth would use
    console.log('\n2️⃣ Testing NextAuth-style query:');
    const prisma2 = new PrismaClient();
    
    try {
      const user = await prisma2.user.findUnique({
        where: {
          email: 'apexfund@nogalss.com'
        }
      });
      
      if (!user || !user.password) {
        console.log('   NextAuth query: ERROR - User not found or no password');
        return;
      }
      
      const bcrypt = require('bcryptjs');
      const testPassword = 'ApexFunds123!@#Secure';
      const isPasswordValid = await bcrypt.compare(testPassword, user.password);
      
      if (!isPasswordValid) {
        console.log('   NextAuth query: ERROR - Invalid password');
        return;
      }
      
      console.log('   NextAuth query: OK');
      console.log('   Password verification: OK');
      
      const result = {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
      };
      
      console.log('   Result:', result);
      
    } catch (error) {
      console.log('   NextAuth query: ERROR -', error.message);
    } finally {
      await prisma2.$disconnect();
    }
    
    // Test 3: Test if the issue is with the NextAuth configuration
    console.log('\n3️⃣ Testing NextAuth configuration:');
    try {
      const authConfig = require('./src/lib/auth.ts');
      console.log('   Auth config loaded: OK');
      console.log('   Providers count:', authConfig.authOptions.providers.length);
      console.log('   Session strategy:', authConfig.authOptions.session.strategy);
    } catch (error) {
      console.log('   Auth config loaded: ERROR -', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

testDbConnection();


