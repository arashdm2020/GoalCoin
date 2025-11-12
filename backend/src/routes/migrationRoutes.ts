import express from 'express';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const router = express.Router();
const prisma = new PrismaClient();

// Execute migration for admin reviewer system
router.post('/init-admin-system', async (req, res) => {
  try {
    console.log('🔄 Running admin system migration...');
    
    // Read and execute the migration SQL
    const migrationPath = join(__dirname, '../prisma/migrations/024_admin_reviewer_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await prisma.$executeRawUnsafe(migrationSQL);
    
    console.log('✅ Admin system migration completed successfully');
    
    res.json({ 
      success: true, 
      message: 'Admin reviewer system initialized successfully',
      tables: ['reviewers', 'submissions', 'reviews', 'audit_logs']
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check if admin tables exist
router.get('/check-admin-tables', async (req, res) => {
  try {
    const tables = ['reviewers', 'submissions', 'reviews', 'audit_logs'];
    const results: Record<string, boolean> = {};
    
    for (const table of tables) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`);
        results[table] = true;
      } catch (error) {
        results[table] = false;
      }
    }
    
    res.json({ 
      success: true, 
      tables: results,
      allTablesExist: Object.values(results).every(Boolean)
    });
  } catch (error) {
    console.error('❌ Check tables failed:', error);
    res.status(500).json({ 
      error: 'Failed to check tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as migrationRoutes };
