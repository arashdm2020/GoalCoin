const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://goalcoin_user:e29X94Ny6msJRJT4GbMTZzNaPj7PbOxB@dpg-d44aclq4d50c73883vj0-a.oregon-postgres.render.com/goalcoin';

async function runSqlFile(sqlFilePath) {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Read SQL file
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(`📄 Reading SQL file: ${sqlFilePath}`);
    
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    console.log('🚀 Executing SQL...');
    const result = await client.query(sqlContent);
    
    console.log('✅ SQL executed successfully');
    if (result.rows && result.rows.length > 0) {
      console.log('📊 Results:');
      console.table(result.rows);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Get SQL file path from command line argument
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error('❌ Please provide SQL file path as argument');
  console.log('Usage: node run-sql.js <path-to-sql-file>');
  process.exit(1);
}

runSqlFile(sqlFile);
