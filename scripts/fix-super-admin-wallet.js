const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSuperAdminWallet() {
  try {
    console.log('🔧 Fixing Super Admin Wallet Balance...\n');

    // Get allocation amounts
    const [memberAlloc, coopAlloc] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'SUPER_ADMIN_ALLOCATION_MEMBER_AMOUNT' } }),
      prisma.setting.findUnique({ where: { key: 'SUPER_ADMIN_ALLOCATION_COOP_AMOUNT' } })
    ]);
    const memberAmount = memberAlloc ? Number(memberAlloc.value) : 0;
    const coopAmount = coopAlloc ? Number(coopAlloc.value) : 0;

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

    // Calculate correct balance
    const correctBalance = (memberRegCount * memberAmount) + (coopRegCount * coopAmount);

    console.log(`📊 Member Registrations: ${memberRegCount} × ₦${memberAmount.toLocaleString()} = ₦${(memberRegCount * memberAmount).toLocaleString()}`);
    console.log(`📊 Cooperative Registrations: ${coopRegCount} × ₦${coopAmount.toLocaleString()} = ₦${(coopRegCount * coopAmount).toLocaleString()}`);
    console.log(`💰 Correct Balance: ₦${correctBalance.toLocaleString()}\n`);

    // Update balance
    await prisma.setting.upsert({
      where: { key: 'SUPER_ADMIN_WALLET_BALANCE' },
      update: { value: correctBalance.toString() },
      create: { key: 'SUPER_ADMIN_WALLET_BALANCE', value: correctBalance.toString() },
    });

    console.log('✅ Super Admin Wallet Balance updated successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSuperAdminWallet();




