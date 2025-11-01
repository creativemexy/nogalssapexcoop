const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Standard Nigerian bank codes (NIBSS format)
const correctBankCodes = {
  'FIRST BANK OF NIGERIA': '000016',
  'ACCESS BANK': '000014', 
  'FIDELITY BANK': '000007',
  'GTBANK PLC': '000013',
  'UNITED BANK FOR AFRICA': '000004',
  'ZENITH BANK': '000015',
  'STANBIC IBTC BANK': '000012',
  'UNION BANK OF NIGERIA': '000018',
  'WEMA BANK': '000017',
  'POLARIS BANK': '000008',
  'JAIZ BANK': '000006',
  'FCMB': '000003',
  'STERLING BANK': '000001',
  'KEYSTONE BANK': '000002',
  'FIRST CITY MONUMENT BANK': '000003'
};

async function fixBankCodes() {
  try {
    console.log('🔧 Fixing bank codes...\n');
    
    for (const [bankName, correctCode] of Object.entries(correctBankCodes)) {
      const result = await prisma.bank.updateMany({
        where: { name: bankName },
        data: { code: correctCode }
      });
      
      if (result.count > 0) {
        console.log(`✅ Updated ${bankName}: ${correctCode}`);
      } else {
        console.log(`⚠️  Bank not found: ${bankName}`);
      }
    }
    
    console.log('\n📋 Verifying updates:');
    const updatedBanks = await prisma.bank.findMany({
      where: {
        name: {
          in: Object.keys(correctBankCodes)
        }
      },
      select: { name: true, code: true },
      orderBy: { name: 'asc' }
    });
    
    updatedBanks.forEach(bank => {
      const expectedCode = correctBankCodes[bank.name];
      const status = bank.code === expectedCode ? '✅' : '❌';
      console.log(`${status} ${bank.name}: ${bank.code} ${bank.code !== expectedCode ? `(expected: ${expectedCode})` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBankCodes();

