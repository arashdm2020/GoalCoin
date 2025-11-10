/**
 * Apply tier name migration to production database
 * Run this on Render or locally with production DATABASE_URL
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, '../prisma/migrations/020_update_tier_names.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Applying tier name migration...');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('Updated tier names:');
    console.log('  ROOKIE → MINTED');
    console.log('  SUPPORTER → STAKED');
    console.log('  PRO → VERIFIED');
    console.log('  ELITE → ASCENDANT');
    console.log('  LEGEND → APEX');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

applyMigration()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
