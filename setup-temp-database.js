const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up temporary SQLite database for testing...\n');

// Backup original schema
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const backupPath = path.join(__dirname, 'prisma', 'schema.prisma.backup');

try {
  // Read original schema
  const originalSchema = fs.readFileSync(schemaPath, 'utf8');
  
  // Create backup
  fs.writeFileSync(backupPath, originalSchema);
  console.log('✅ Created backup of original schema');
  
  // Create SQLite version
  const sqliteSchema = originalSchema.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}`
  );
  
  // Write SQLite schema
  fs.writeFileSync(schemaPath, sqliteSchema);
  console.log('✅ Updated schema to use SQLite');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Run: npx prisma db push --force-reset');
  console.log('2. Run: node create-super-admin.js');
  console.log('3. Test login at: http://localhost:3000/auth/signin');
  console.log('\n⚠️  To restore PostgreSQL schema later:');
  console.log('   node restore-postgres-schema.js');
  
} catch (error) {
  console.error('❌ Error setting up temporary database:', error.message);
}