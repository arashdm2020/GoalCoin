const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://goalcoin_user:e29X94Ny6msJRJT4GbMTZzNaPj7PbOxB@dpg-d44aclq4d50c73883vj0-a.oregon-postgres.render.com/goalcoin'
});
async function setupAdminTables() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    
    console.log('📋 Checking existing tables...');
    const existingTables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    console.log('Existing tables:', existingTables.rows.map(r => r.table_name));
    
    // Create reviewer table
    console.log('📝 Creating reviewers table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviewers (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        voting_weight INTEGER DEFAULT 1,
        strikes INTEGER DEFAULT 0,
        status TEXT DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    // Create submission table
    console.log('📝 Creating submissions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        file_url TEXT,
        thumbnail TEXT,
        description TEXT,
        country_code TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    // Create review table
    console.log('📝 Creating reviews table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL,
        reviewer_wallet TEXT NOT NULL,
        vote TEXT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submission_id) REFERENCES submissions(id)
      )
    `);
    
    // Create audit_logs table
    console.log('📝 Creating audit_logs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        reviewer_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reviewer_id) REFERENCES reviewers(id)
      )
    `);
    
    // Create indexes
    console.log('📈 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS reviewers_user_id_idx ON reviewers(user_id)',
      'CREATE INDEX IF NOT EXISTS reviewers_status_idx ON reviewers(status)',
      'CREATE INDEX IF NOT EXISTS submissions_user_id_idx ON submissions(user_id)',
      'CREATE INDEX IF NOT EXISTS submissions_status_idx ON submissions(status)',
      'CREATE INDEX IF NOT EXISTS reviews_submission_id_idx ON reviews(submission_id)',
      'CREATE INDEX IF NOT EXISTS reviews_reviewer_wallet_idx ON reviews(reviewer_wallet)',
      'CREATE INDEX IF NOT EXISTS audit_logs_reviewer_id_idx ON audit_logs(reviewer_id)'
    ];
    
    for (const index of indexes) {
      await client.query(index);
    }
    
    console.log('✅ All admin tables created successfully!');
    
    // Verify tables were created
    const finalTables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name IN ('reviewers', 'submissions', 'reviews', 'audit_logs')
    `);
    
    console.log('✅ Created tables:', finalTables.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('❌ Error setting up tables:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

setupAdminTables();
