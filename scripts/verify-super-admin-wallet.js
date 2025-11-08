const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifySuperAdminWallet() {
  try {
    console.log('🔍 Verifying Super Admin Wallet Balance...\n');

    // Get current balance from settings
    const balSetting = await prisma.setting.findUnique({
      where: { key: 'SUPER_ADMIN_WALLET_BALANCE' }
    });
    const currentBalance = balSetting ? Number(balSetting.value) : 0;
    console.log(`📊 Current Balance in Database: ₦${currentBalance.toLocaleString()}`);

    // Get allocation amounts
    const [memberAlloc, coopAlloc] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'SUPER_ADMIN_ALLOCATION_MEMBER_AMOUNT' } }),
      prisma.setting.findUnique({ where: { key: 'SUPER_ADMIN_ALLOCATION_COOP_AMOUNT' } })
    ]);
    const memberAmount = memberAlloc ? Number(memberAlloc.value) : 0;
    const coopAmount = coopAlloc ? Number(coopAlloc.value) : 0;
    console.log(`💰 Member Allocation Amount: ₦${memberAmount.toLocaleString()}`);
    console.log(`💰 Cooperative Allocation Amount: ₦${coopAmount.toLocaleString()}\n`);

    // Count registrations
    const [memberRegCount, coopRegCount] = await Promise.all([
      prisma.transaction.count({
        where: {
          reference: { startsWith: 'REG_' },
          status: 'SUCCESSFUL',
          description: { contains: 'Member registration' }
        }
      }),
      prisma.transaction.count({
        where: {
          reference: { startsWith: 'REG_' },
          status: 'SUCCESSFUL',
          description: { contains: 'Cooperative registration' }
        }
      })
    ]);

    console.log(`📈 Member Registrations: ${memberRegCount}`);
    console.log(`📈 Cooperative Registrations: ${coopRegCount}\n`);

    // Calculate expected balance
    const expectedBalance = (memberRegCount * memberAmount) + (coopRegCount * coopAmount);
    console.log(`🧮 Expected Balance: ₦${expectedBalance.toLocaleString()}`);
    console.log(`   (${memberRegCount} members × ₦${memberAmount.toLocaleString()} + ${coopRegCount} coops × ₦${coopAmount.toLocaleString()})\n`);

    if (currentBalance !== expectedBalance) {
      console.log('⚠️  Balance mismatch detected!');
      console.log(`   Current: ₦${currentBalance.toLocaleString()}`);
      console.log(`   Expected: ₦${expectedBalance.toLocaleString()}`);
      console.log(`   Difference: ₦${(expectedBalance - currentBalance).toLocaleString()}\n`);
      
      // Ask if user wants to fix it
      console.log('💡 To fix the balance, run: node scripts/fix-super-admin-wallet.js');
    } else {
      console.log('✅ Balance is correct!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySuperAdminWallet();




