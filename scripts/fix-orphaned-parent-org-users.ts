import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * This script finds users with PARENT_ORGANIZATION role that don't have
 * a corresponding parent_organizations record and creates the missing record.
 */
async function fixOrphanedParentOrgUsers() {
  try {
    console.log('🔍 Searching for orphaned PARENT_ORGANIZATION users...');

    // Find all users with PARENT_ORGANIZATION role
    const parentOrgUsers = await prisma.user.findMany({
      where: {
        role: 'PARENT_ORGANIZATION'
      },
      include: {
        parentOrganization: true
      }
    });

    console.log(`Found ${parentOrgUsers.length} users with PARENT_ORGANIZATION role`);

    let fixed = 0;
    let skipped = 0;

    for (const user of parentOrgUsers) {
      // Check if user already has a parent organization
      if (user.parentOrganization) {
        console.log(`✓ User ${user.email} already has parent organization: ${user.parentOrganization.name}`);
        skipped++;
        continue;
      }

      console.log(`⚠️  Found orphaned user: ${user.email} (ID: ${user.id})`);

      // Try to find a super admin or apex user to use as creator
      let creator = await prisma.user.findFirst({
        where: {
          role: 'SUPER_ADMIN',
          isActive: true
        },
        orderBy: {
          createdAt: 'asc' // Use the first/oldest super admin
        }
      });

      // Fallback to APEX user if no SUPER_ADMIN
      if (!creator) {
        creator = await prisma.user.findFirst({
          where: {
            role: 'APEX',
            isActive: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        });
      }

      // Last resort: use the first active user
      if (!creator) {
        creator = await prisma.user.findFirst({
          where: {
            isActive: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        });
      }

      if (!creator) {
        console.error(`❌ No active user found to use as creator. Cannot create parent organization for ${user.email}`);
        continue;
      }

      console.log(`   Using ${creator.role} user (${creator.email}) as creator`);

      // Create the missing parent organization record
      try {
        const organization = await prisma.parentOrganization.create({
          data: {
            name: user.firstName || 'Organization',
            description: `Auto-created for orphaned user: ${user.email}`,
            contactEmail: user.email || '',
            contactPhone: user.phoneNumber || null,
            address: user.address || null,
            createdBy: creator.id,
            userId: user.id,
            isActive: user.isActive,
            defaultPassword: 'Parpass@25', // Default password
          }
        });

        console.log(`✅ Created parent organization for user ${user.email}: ${organization.id}`);
        fixed++;
      } catch (error: any) {
        console.error(`❌ Failed to create parent organization for ${user.email}:`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Total PARENT_ORGANIZATION users: ${parentOrgUsers.length}`);
    console.log(`   - Already have organization: ${skipped}`);
    console.log(`   - Fixed (created organization): ${fixed}`);
    console.log(`   - Failed: ${parentOrgUsers.length - skipped - fixed}`);

  } catch (error) {
    console.error('Error fixing orphaned users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixOrphanedParentOrgUsers()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

