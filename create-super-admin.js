const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Strong password validator (matches our policy)
function isStrongPassword(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 12) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUppercase && hasLowercase && hasDigit && hasSpecial;
}

async function createSuperAdmin() {
  const prisma = new PrismaClient();
  
  try {
    // Check if super admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'SUPER_ADMIN'
      }
    });

    if (existingAdmin) {
      console.log('Super admin already exists:', existingAdmin.email);
      return;
    }

    // Generate a strong password that meets our policy
    const strongPassword = 'Admin123!@#Secure';
    
    // Validate the password meets our strong policy
    if (!isStrongPassword(strongPassword)) {
      console.error('❌ Generated password does not meet strong password policy');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(strongPassword, 12);
    
    const superAdmin = await prisma.user.create({
      data: {
        email: 'admin@nogalss.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        phoneNumber: '08000000000',
        isActive: true,
        isVerified: true,
        address: 'Nogalss Headquarters'
      }
    });

    console.log('✅ Super Admin created successfully!');
    console.log('Email:', superAdmin.email);
    console.log('Password:', strongPassword);
    console.log('Role:', superAdmin.role);
    console.log('\n🔐 Password meets strong security requirements:');
    console.log('   - 12+ characters with uppercase, lowercase, number, and special character');
    console.log('\n⚠️  Please change the password after first login for additional security!');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
