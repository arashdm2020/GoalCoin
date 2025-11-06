#!/usr/bin/env node

/**
 * Production migration script for Render.com
 * Handles schema migration from old to new format
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function runProductionMigration() {
  console.log('🚀 Starting production database migration...');
  console.log('📍 Current working directory:', process.cwd());
  console.log('📍 Script location:', __dirname);
  
  const prisma = new PrismaClient();
  
  try {
    // Test if new schema exists
    console.log('🔍 Checking current database schema...');
    await prisma.user.findFirst({ select: { id: true } });
    console.log('✅ New schema already exists, no migration needed');
    return;
  } catch (error) {
    if (error.code === 'P2022' && error.meta?.column === 'users.id') {
      console.log('🔄 Old schema detected, running safe migration...');
      
      try {
        // Read and execute the safe migration SQL
        const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', '20241106_safe_user_migration', 'migration.sql');
        
        if (!fs.existsSync(migrationPath)) {
          throw new Error(`Migration file not found: ${migrationPath}`);
        }
        
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        console.log('📄 Migration SQL loaded, executing...');
        
        // Split SQL into individual statements and execute them
        const statements = migrationSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);
        
        for (const statement of statements) {
          if (statement.trim()) {
            console.log(`🔧 Executing: ${statement.substring(0, 50)}...`);
            await prisma.$executeRawUnsafe(statement + ';');
          }
        }
        
        console.log('✅ Safe migration completed successfully!');
        
        // Verify the migration worked
        await prisma.user.findFirst({ select: { id: true } });
        console.log('✅ Migration verification successful');
        
      } catch (migrationError) {
        console.error('❌ Migration failed:', migrationError);
        throw migrationError;
      }
    } else {
      console.error('❌ Unexpected database error:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runProductionMigration()
  .then(() => {
    console.log('🎉 Production migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Production migration failed:', error);
    process.exit(1);
  });
