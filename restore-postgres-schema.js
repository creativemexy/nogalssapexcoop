const fs = require('fs');
const path = require('path');

console.log('🔄 Restoring PostgreSQL schema...\n');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const backupPath = path.join(__dirname, 'prisma', 'schema.prisma.backup');

try {
  if (fs.existsSync(backupPath)) {
    const backupSchema = fs.readFileSync(backupPath, 'utf8');
    fs.writeFileSync(schemaPath, backupSchema);
    console.log('✅ Restored PostgreSQL schema from backup');
    
    // Clean up
    fs.unlinkSync(backupPath);
    console.log('✅ Removed backup file');
    
    console.log('\n⚠️  Remember to:');
    console.log('1. Set up your PostgreSQL database');
    console.log('2. Update DATABASE_URL in .env');
    console.log('3. Run: npx prisma db push');
    console.log('4. Run: node create-super-admin.js');
    
  } else {
    console.log('❌ No backup file found');
  }
  
} catch (error) {
  console.error('❌ Error restoring schema:', error.message);
}