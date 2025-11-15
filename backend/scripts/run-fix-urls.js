const { Client } = require('pg');

const DATABASE_URL = 'postgresql://goalcoin_user:e29X94Ny6msJRJT4GbMTZzNaPj7PbOxB@dpg-d44aclq4d50c73883vj0-a.oregon-postgres.render.com/goalcoin';

async function fixSubmissionUrls() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Use single avatar ID
    const avatarId = 37;
    const newUrl = `https://avatar.iran.liara.run/public/${avatarId}`;

    // Get all submissions with example.com, old avatar URLs, or .mp4 files
    const selectQuery = `
      SELECT id, file_url 
      FROM submissions 
      WHERE file_url LIKE '%example.com%' 
         OR file_url LIKE '%avatar.iran.liara.run/public/14%'
         OR file_url LIKE '%avatar.iran.liara.run/public/38%'
         OR file_url LIKE '%avatar.iran.liara.run/public/68%'
         OR file_url LIKE '%avatar.iran.liara.run/public/100%'
         OR file_url LIKE '%.mp4%'
         OR file_url LIKE '%.jpg%'
         OR file_url LIKE '%.jpeg%'
         OR file_url LIKE '%.png%'
    `;
    
    const result = await client.query(selectQuery);
    console.log(`📊 Found ${result.rows.length} submissions to fix`);

    // Update each submission
    let updated = 0;
    for (const row of result.rows) {
      const updateQuery = `
        UPDATE submissions 
        SET file_url = $1 
        WHERE id = $2
      `;
      
      await client.query(updateQuery, [newUrl, row.id]);
      updated++;
      console.log(`✅ Updated submission ${row.id} (${updated}/${result.rows.length})`);
    }

    console.log(`\n✨ Successfully updated ${updated} submissions!`);

    // Verify the changes
    const verifyQuery = `
      SELECT COUNT(*) as count 
      FROM submissions 
      WHERE file_url LIKE '%avatar.iran.liara.run%'
    `;
    const verifyResult = await client.query(verifyQuery);
    console.log(`\n📈 Total submissions with avatar URLs: ${verifyResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

fixSubmissionUrls();
