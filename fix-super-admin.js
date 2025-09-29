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

async function fixSuperAdmin() {
  console.log('🔧 Super Admin Fix Tool');
  console.log('========================\n');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL environment variable is not set');
    console.log('\n💡 To fix this:');
    console.log('1. Create a .env file in the project root');
    console.log('2. Add your database connection string:');
    console.log('   DATABASE_URL="postgresql://username:password@host:port/database"');
    console.log('\n📝 Example for local PostgreSQL:');
    console.log('   DATABASE_URL="postgresql://user:password@localhost:5432/nogalss"');
    console.log('\n📝 Example for cloud database (e.g., Supabase, Neon, etc.):');
    console.log('   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"');
    console.log('\n⚠️  After setting up the database URL, run:');
    console.log('   npx prisma db push');
    console.log('   node create-super-admin.js');
    return;
  }

  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking database connection...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check for existing super admin
    console.log('\n🔍 Checking for existing super admin...');
    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true
      }
    });

    console.log(`📊 Found ${superAdmins.length} super admin(s)`);
    
    if (superAdmins.length > 0) {
      console.log('\n👥 Existing Super Admin(s):');
      superAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.firstName} ${admin.lastName} (${admin.email})`);
        console.log(`   Status: ${admin.isActive ? 'Active' : 'Inactive'}, ${admin.isVerified ? 'Verified' : 'Unverified'}`);
        console.log(`   Created: ${admin.createdAt.toISOString()}`);
      });

      // Check if any are inactive or unverified
      const inactiveAdmins = superAdmins.filter(admin => !admin.isActive || !admin.isVerified);
      
      if (inactiveAdmins.length > 0) {
        console.log('\n🔧 Fixing inactive/unverified super admin accounts...');
        
        for (const admin of inactiveAdmins) {
          await prisma.user.update({
            where: { id: admin.id },
            data: {
              isActive: true,
              isVerified: true
            }
          });
          console.log(`✅ Fixed account: ${admin.email}`);
        }
      }

      console.log('\n🔐 Super Admin Login Credentials:');
      console.log('Email: admin@nogalss.com');
      console.log('Password: Admin123!@#Secure');
      console.log('\n⚠️  If you still cannot log in, the password might have been changed.');
      console.log('💡 To reset the password, run: node reset-super-admin-password.js');
      
    } else {
      console.log('\n❌ No super admin found in database');
      console.log('🔧 Creating new super admin...');
      
      // Generate a strong password
      const strongPassword = 'Admin123!@#Secure';
      
      if (!isStrongPassword(strongPassword)) {
        console.error('❌ Generated password does not meet strong password policy');
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(strongPassword, 12);

      // Create super admin user
      const superAdmin = await prisma.user.create({
        data: {
          email: 'admin@nogalss.com',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          phoneNumber: '+2341234567890',
          role: 'SUPER_ADMIN',
          isActive: true,
          isVerified: true,
          address: 'Nogalss Headquarters',
        }
      });

      console.log('✅ Super Admin created successfully!');
      console.log('\n🔐 Login Credentials:');
      console.log('Email:', superAdmin.email);
      console.log('Password:', strongPassword);
      console.log('\n⚠️  Please change the password after first login for additional security!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Database connection failed. This could be because:');
      console.log('1. Database server is not running');
      console.log('2. Incorrect connection string in DATABASE_URL');
      console.log('3. Network/firewall issues');
      console.log('4. Database does not exist');
    } else if (error.code === 'P2002') {
      console.log('\n💡 Super admin with this email already exists');
      console.log('Try running the check again or use a different email');
    } else {
      console.log('\n💡 For more help, check:');
      console.log('- Database connection string format');
      console.log('- Database server status');
      console.log('- Prisma schema and migrations');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

// Also create a password reset function
async function resetSuperAdminPassword() {
  const prisma = new PrismaClient();
  
  try {
    const newPassword = 'Admin123!@#Secure';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const result = await prisma.user.updateMany({
      where: {
        role: 'SUPER_ADMIN',
        email: 'admin@nogalss.com'
      },
      data: {
        password: hashedPassword,
        isActive: true,
        isVerified: true
      }
    });

    if (result.count > 0) {
      console.log('✅ Super admin password reset successfully!');
      console.log('Email: admin@nogalss.com');
      console.log('New Password:', newPassword);
    } else {
      console.log('❌ No super admin found to reset password');
    }
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Check command line arguments
if (process.argv.includes('--reset-password')) {
  resetSuperAdminPassword();
} else {
  fixSuperAdmin();
}