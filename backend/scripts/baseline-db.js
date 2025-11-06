#!/usr/bin/env node

/**
 * Database baseline script for production deployment
 * Handles existing database schema without losing data
 */

const { execSync } = require('child_process');

function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    const output = execSync(command, { stdio: 'pipe', encoding: 'utf8' });
    console.log(`✅ ${description} completed`);
    return { success: true, output };
  } catch (error) {
    console.log(`⚠️ ${description} failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function baselineDatabase() {
  console.log('🚀 Starting database baseline process...');

  // Step 1: Check if migrations table exists
  const checkMigrations = runCommand(
    'npx prisma migrate status',
    'Checking migration status'
  );

  if (checkMigrations.success) {
    console.log('✅ Database is already migrated, proceeding with deploy');
    const deploy = runCommand('npx prisma migrate deploy', 'Deploying migrations');
    return deploy.success;
  }

  // Step 2: If migrations table doesn't exist, we need to baseline
  console.log('📋 Database needs baseline - marking existing schema as migrated');
  
  // Mark the migration as already applied (baseline)
  const baseline = runCommand(
    'npx prisma migrate resolve --applied 20241106_safe_user_migration',
    'Baselining existing database'
  );

  if (!baseline.success) {
    console.log('⚠️ Baseline failed, trying to create migration table and apply migration');
    
    // Try to deploy migrations (this will create the migration table)
    const deploy = runCommand('npx prisma migrate deploy', 'Deploying migrations');
    
    if (!deploy.success) {
      console.error('❌ Failed to baseline or deploy migrations');
      process.exit(1);
    }
  }

  console.log('✅ Database baseline completed successfully');
  return true;
}

// Run the baseline process
baselineDatabase().catch(error => {
  console.error('❌ Baseline process failed:', error);
  process.exit(1);
});
