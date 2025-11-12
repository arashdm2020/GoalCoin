const { Client } = require('pg');

// Production database connection
const client = new Client({
  connectionString: 'postgresql://goalcoin_user:e29X94Ny6msJRJT4GbMTZzNaPj7PbOxB@dpg-d44aclq4d50c73883vj0-a.oregon-postgres.render.com/goalcoin'
});

// Top 50 countries by GDP/population
const TOP_COUNTRIES = [
  'US', 'CN', 'JP', 'DE', 'IN', 'GB', 'FR', 'IT', 'BR', 'CA',
  'KR', 'RU', 'AU', 'ES', 'MX', 'ID', 'NL', 'SA', 'TR', 'CH',
  'TW', 'BE', 'IE', 'IL', 'NO', 'AE', 'EG', 'NG', 'ZA', 'AR',
  'TH', 'SG', 'MY', 'PH', 'CL', 'PK', 'BD', 'VN', 'CO', 'PL',
  'SE', 'AT', 'DK', 'FI', 'CZ', 'PT', 'GR', 'NZ', 'HU', 'RO'
];

function generateWalletAddress() {
  return '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function generateHandle() {
  const adjectives = ['Fit', 'Strong', 'Active', 'Healthy', 'Energetic', 'Power', 'Speed', 'Agile', 'Dynamic', 'Elite'];
  const nouns = ['Athlete', 'Champion', 'Warrior', 'Hero', 'Star', 'Master', 'Legend', 'Pro', 'Expert', 'Guru'];
  const numbers = Math.floor(Math.random() * 9999) + 1;
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${numbers}`;
}

function generateEmail(handle) {
  return `${handle.toLowerCase()}@example.com`;
}

async function seedProductionData() {
  try {
    console.log('🔌 Connecting to production database...');
    await client.connect();
    
    console.log('🧹 Cleaning existing data...');
    // Clean in correct order to respect foreign key constraints
    await client.query('DELETE FROM audit_logs');
    await client.query('DELETE FROM reviews');
    await client.query('DELETE FROM submissions');
    await client.query('DELETE FROM reviewers');
    await client.query('DELETE FROM ad_views');
    await client.query('DELETE FROM referrals');
    await client.query('DELETE FROM treasury_transactions');
    await client.query('DELETE FROM xp_transactions');
    await client.query('DELETE FROM user_challenges');
    await client.query('DELETE FROM challenges');
    await client.query('DELETE FROM users');
    
    console.log('👥 Creating 500 users...');
    const users = [];
    for (let i = 0; i < 500; i++) {
      const country = TOP_COUNTRIES[Math.floor(Math.random() * TOP_COUNTRIES.length)];
      const handle = generateHandle();
      
      const result = await client.query(`
        INSERT INTO users (
          id, wallet, email, handle, country_code, xp_points, goal_points, 
          current_streak, burn_multiplier, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING id
      `, [
        `user_${i + 1}`,
        generateWalletAddress(),
        generateEmail(handle),
        handle,
        country,
        Math.floor(Math.random() * 10000),
        Math.floor(Math.random() * 5000),
        Math.floor(Math.random() * 30),
        1 + Math.random() * 2,
        new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        new Date()
      ]);
      
      users.push({ id: result.rows[0].id, wallet: generateWalletAddress() });
      
      if ((i + 1) % 50 === 0) {
        console.log(`  Created ${i + 1} users...`);
      }
    }
    
    console.log('🎯 Creating 100 challenges...');
    for (let i = 0; i < 100; i++) {
      await client.query(`
        INSERT INTO challenges (
          id, title, description, type, xp_reward, goal_reward,
          start_date, end_date, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
      `, [
        `challenge_${i + 1}`,
        `Challenge ${i + 1}`,
        `Description for challenge ${i + 1}`,
        ['WORKOUT', 'MEAL', 'WARMUP_ROUTINE'][Math.floor(Math.random() * 3)],
        Math.floor(Math.random() * 100) + 10,
        Math.floor(Math.random() * 50) + 5,
        new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
        Math.random() > 0.2,
        new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
        new Date()
      ]);
    }
    
    console.log('📝 Creating 1000 user challenges...');
    for (let i = 0; i < 1000; i++) {
      await client.query(`
        INSERT INTO user_challenges (
          user_id, challenge_id, status, completed_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        )
      `, [
        users[Math.floor(Math.random() * users.length)].id,
        `challenge_${Math.floor(Math.random() * 100) + 1}`,
        Math.random() > 0.3 ? 'COMPLETED' : 'IN_PROGRESS',
        Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
        new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        new Date()
      ]);
    }
    
    console.log('💰 Creating 2000 XP transactions...');
    for (let i = 0; i < 2000; i++) {
      await client.query(`
        INSERT INTO xp_transactions (
          user_id, xp_points, goal_points, transaction_type, created_at
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        users[Math.floor(Math.random() * users.length)].id,
        Math.floor(Math.random() * 200) + 10,
        Math.floor(Math.random() * 100) + 5,
        'CHALLENGE_COMPLETED',
        new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
      ]);
    }
    
    console.log('🏦 Creating 500 treasury transactions...');
    for (let i = 0; i < 500; i++) {
      await client.query(`
        INSERT INTO treasury_transactions (
          amount_usdt, amount_goalcoin, transaction_type, created_at
        ) VALUES ($1, $2, $3, $4)
      `, [
        Math.random() * 1000 + 50,
        Math.random() * 10000 + 500,
        Math.random() > 0.5 ? 'DEPOSIT' : 'BURN',
        new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
      ]);
    }
    
    console.log('👥 Creating 200 referrals...');
    for (let i = 0; i < 200; i++) {
      const referrer = users[Math.floor(Math.random() * users.length)];
      const referred = users[Math.floor(Math.random() * users.length)];
      
      if (referrer.id !== referred.id) {
        await client.query(`
          INSERT INTO referrals (
            referrer_id, referred_id, status, reward_points, created_at
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          referrer.id,
          referred.id,
          'COMPLETED',
          Math.floor(Math.random() * 100) + 50,
          new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
        ]);
      }
    }
    
    console.log('👁️ Creating 3000 ad views...');
    for (let i = 0; i < 3000; i++) {
      await client.query(`
        INSERT INTO ad_views (
          user_id, ad_type, reward_points, created_at
        ) VALUES ($1, $2, $3, $4)
      `, [
        users[Math.floor(Math.random() * users.length)].id,
        ['BANNER', 'VIDEO', 'POPUP'][Math.floor(Math.random() * 3)],
        Math.floor(Math.random() * 10) + 1,
        new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      ]);
    }
    
    console.log('👥 Creating 50 reviewers...');
    const reviewers = [];
    for (let i = 0; i < 50; i++) {
      const user = users[i];
      await client.query(`
        INSERT INTO reviewers (
          id, user_id, voting_weight, strikes, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        user.id,
        user.id,
        Math.floor(Math.random() * 3) + 1,
        Math.floor(Math.random() * 3),
        ['ACTIVE', 'SUSPENDED'][Math.floor(Math.random() * 2)],
        new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
        new Date()
      ]);
      reviewers.push(user);
    }
    
    console.log('📤 Creating 300 submissions...');
    const submissions = [];
    for (let i = 0; i < 300; i++) {
      const result = await client.query(`
        INSERT INTO submissions (
          id, user_id, type, status, file_url, thumbnail, description, 
          country_code, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        `submission_${i + 1}`,
        users[Math.floor(Math.random() * users.length)].id,
        ['WORKOUT', 'MEAL', 'WARMUP_ROUTINE'][Math.floor(Math.random() * 3)],
        ['PENDING', 'APPROVED', 'REJECTED'][Math.floor(Math.random() * 3)],
        `https://example.com/files/${Math.random().toString(36).substring(7)}.mp4`,
        `https://example.com/thumbnails/${Math.random().toString(36).substring(7)}.jpg`,
        `Description for submission ${i + 1}`,
        TOP_COUNTRIES[Math.floor(Math.random() * TOP_COUNTRIES.length)],
        new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        new Date()
      ]);
      submissions.push(result.rows[0].id);
    }
    
    console.log('🔍 Creating 600 reviews...');
    for (let i = 0; i < 600; i++) {
      const reviewer = reviewers[Math.floor(Math.random() * reviewers.length)];
      const submission = submissions[Math.floor(Math.random() * submissions.length)];
      
      await client.query(`
        INSERT INTO reviews (
          id, submission_id, reviewer_wallet, vote, comment, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        `review_${i + 1}`,
        submission,
        reviewer.wallet,
        Math.random() > 0.2 ? 'APPROVE' : 'REJECT',
        `Review comment ${i + 1}`,
        new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      ]);
    }
    
    console.log('📋 Creating 500 audit logs...');
    for (let i = 0; i < 500; i++) {
      const reviewer = reviewers[Math.floor(Math.random() * reviewers.length)];
      const actions = ['STATUS_CHANGE', 'STRIKE_ADDED', 'STRIKE_RESET', 'REVIEWER_ADDED', 'REVIEWER_REMOVED'];
      
      await client.query(`
        INSERT INTO audit_logs (
          id, reviewer_id, action, details, created_at
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        `audit_${i + 1}`,
        reviewer.id,
        actions[Math.floor(Math.random() * actions.length)],
        `Audit log details ${i + 1}`,
        new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
      ]);
    }
    
    console.log('✅ Production data seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`  - Users: 500`);
    console.log(`  - Challenges: 100`);
    console.log(`  - User Challenges: 1000`);
    console.log(`  - XP Transactions: 2000`);
    console.log(`  - Treasury Transactions: 500`);
    console.log(`  - Referrals: 200`);
    console.log(`  - Ad Views: 3000`);
    console.log(`  - Reviewers: 50`);
    console.log(`  - Submissions: 300`);
    console.log(`  - Reviews: 600`);
    console.log(`  - Audit Logs: 500`);
    
  } catch (error) {
    console.error('❌ Error seeding production data:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

seedProductionData();
