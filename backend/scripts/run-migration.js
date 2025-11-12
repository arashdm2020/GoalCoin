const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgresql://goalcoin_user:e29X94Ny6msJRJT4GbMTZzNaPj7PbOxB@dpg-d44aclq4d50c73883vj0-a.oregon-postgres.render.com/goalcoin'
});

async function runMigration() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    
    console.log('📋 Checking existing tables...');
    const existingTables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('Existing tables:', existingTables.rows.map(r => r.table_name));
    
    // Read migration SQL
    const migrationPath = path.join(__dirname, '../prisma/migrations/024_admin_reviewer_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 Running admin system migration...');
    
    // Split SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('📝 Executing:', statement.substring(0, 50) + '...');
        await client.query(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    const finalTables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name IN ('reviewers', 'submissions', 'reviews', 'audit_logs')
      ORDER BY table_name
    `);
    
    console.log('✅ Created admin tables:', finalTables.rows.map(r => r.table_name));
    
    // Check if we can query the tables
    console.log('🔍 Testing table access...');
    const reviewerCount = await client.query('SELECT COUNT(*) as count FROM reviewers');
    const submissionCount = await client.query('SELECT COUNT(*) as count FROM submissions');
    const reviewCount = await client.query('SELECT COUNT(*) as count FROM reviews');
    const auditCount = await client.query('SELECT COUNT(*) as count FROM audit_logs');
    
    console.log('📊 Table records:');
    console.log('  - reviewers:', reviewerCount.rows[0].count);
    console.log('  - submissions:', submissionCount.rows[0].count);
    console.log('  - reviews:', reviewCount.rows[0].count);
    console.log('  - audit_logs:', auditCount.rows[0].count);
    
    console.log('🎉 Database setup completed! Admin reviewer system is ready.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      severity: error.severity,
      detail: error.detail,
      hint: error.hint
    });
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

runMigration();
