const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestCooperatives() {
  try {
    console.log('🧪 Creating test cooperatives and members...\n');

    // Find the parent organization
    const parentOrg = await prisma.parentOrganization.findFirst({
      where: { name: 'mexy' }
    });

    if (!parentOrg) {
      console.log('❌ Parent organization "mexy" not found. Please create it first.');
      return;
    }

    console.log(`✅ Found parent organization: ${parentOrg.name}`);

    // Create test cooperatives
    const cooperatives = [
      {
        name: 'Tech Innovators Cooperative',
        description: 'A cooperative focused on technology innovation',
        email: 'tech@coop.com',
        phoneNumber: '+2348012345678',
        address: '123 Tech Street, Lagos',
        registrationNumber: 'COOP-TECH-001',
        bankAccountNumber: '1234567890',
        bankAccountName: 'Tech Innovators Cooperative',
        bankName: 'Access Bank',
        city: 'Lagos',
        parentOrganizationId: parentOrg.id,
        isActive: true,
      },
      {
        name: 'Agricultural Development Cooperative',
        description: 'Supporting agricultural development in rural areas',
        email: 'agri@coop.com',
        phoneNumber: '+2348098765432',
        address: '456 Farm Road, Abuja',
        registrationNumber: 'COOP-AGRI-002',
        bankAccountNumber: '2345678901',
        bankAccountName: 'Agricultural Development Cooperative',
        bankName: 'First Bank',
        city: 'Abuja',
        parentOrganizationId: parentOrg.id,
        isActive: true,
      },
      {
        name: 'Women Empowerment Cooperative',
        description: 'Empowering women through business and skill development',
        email: 'women@coop.com',
        phoneNumber: '+2348055566677',
        address: '789 Empowerment Avenue, Port Harcourt',
        registrationNumber: 'COOP-WOMEN-003',
        bankAccountNumber: '3456789012',
        bankAccountName: 'Women Empowerment Cooperative',
        bankName: 'GTBank',
        city: 'Port Harcourt',
        parentOrganizationId: parentOrg.id,
        isActive: true,
      }
    ];

    // Clear existing test cooperatives
    await prisma.cooperative.deleteMany({
      where: {
        parentOrganizationId: parentOrg.id,
        name: {
          in: cooperatives.map(c => c.name)
        }
      }
    });

    const createdCooperatives = [];
    for (const coopData of cooperatives) {
      const cooperative = await prisma.cooperative.create({
        data: coopData
      });
      createdCooperatives.push(cooperative);
      console.log(`✅ Created cooperative: ${cooperative.name}`);
    }

    // Create test members for each cooperative
    const memberData = [
      // Tech Innovators Cooperative members
      { firstName: 'John', lastName: 'Doe', email: 'john@tech.com', phoneNumber: '+2348011111111', cooperativeId: createdCooperatives[0].id },
      { firstName: 'Jane', lastName: 'Smith', email: 'jane@tech.com', phoneNumber: '+2348022222222', cooperativeId: createdCooperatives[0].id },
      { firstName: 'Mike', lastName: 'Johnson', email: 'mike@tech.com', phoneNumber: '+2348033333333', cooperativeId: createdCooperatives[0].id },
      { firstName: 'Sarah', lastName: 'Wilson', email: 'sarah@tech.com', phoneNumber: '+2348044444444', cooperativeId: createdCooperatives[0].id },
      
      // Agricultural Development Cooperative members
      { firstName: 'Ahmed', lastName: 'Ibrahim', email: 'ahmed@agri.com', phoneNumber: '+2348055555555', cooperativeId: createdCooperatives[1].id },
      { firstName: 'Fatima', lastName: 'Ali', email: 'fatima@agri.com', phoneNumber: '+2348066666666', cooperativeId: createdCooperatives[1].id },
      { firstName: 'Yusuf', lastName: 'Mohammed', email: 'yusuf@agri.com', phoneNumber: '+2348077777777', cooperativeId: createdCooperatives[1].id },
      
      // Women Empowerment Cooperative members
      { firstName: 'Grace', lastName: 'Okafor', email: 'grace@women.com', phoneNumber: '+2348088888888', cooperativeId: createdCooperatives[2].id },
      { firstName: 'Blessing', lastName: 'Okonkwo', email: 'blessing@women.com', phoneNumber: '+2348099999999', cooperativeId: createdCooperatives[2].id },
      { firstName: 'Peace', lastName: 'Nwosu', email: 'peace@women.com', phoneNumber: '+2348000000000', cooperativeId: createdCooperatives[2].id },
      { firstName: 'Joy', lastName: 'Eze', email: 'joy@women.com', phoneNumber: '+2348111111111', cooperativeId: createdCooperatives[2].id },
      { firstName: 'Faith', lastName: 'Obi', email: 'faith@women.com', phoneNumber: '+2348122222222', cooperativeId: createdCooperatives[2].id }
    ];

    // Clear existing test members
    await prisma.user.deleteMany({
      where: {
        email: {
          in: memberData.map(m => m.email)
        }
      }
    });

    for (const member of memberData) {
      const user = await prisma.user.create({
        data: {
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phoneNumber: member.phoneNumber,
          password: 'hashedpassword123', // In real app, this would be properly hashed
          role: 'MEMBER',
          isActive: true,
          isVerified: true,
          cooperativeId: member.cooperativeId,
        }
      });
      console.log(`✅ Created member: ${user.firstName} ${user.lastName} for ${cooperatives.find(c => c.name === cooperatives[memberData.indexOf(member) >= 4 ? 1 : memberData.indexOf(member) >= 8 ? 2 : 0].name).name}`);
    }

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Parent Organization: ${parentOrg.name}`);
    console.log(`- Cooperatives: ${createdCooperatives.length}`);
    console.log(`- Total Members: ${memberData.length}`);
    console.log('\n🔗 View the enhanced parent organizations page to see the new data!');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestCooperatives();
