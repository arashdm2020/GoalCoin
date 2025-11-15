const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

// Force production database connection
process.env.DATABASE_URL = 'postgresql://goalcoin_user:e29X94Ny6msJRJT4GbMTZzNaPj7PbOxB@dpg-d44aclq4d50c73883vj0-a.oregon-postgres.render.com/goalcoin';

const prisma = new PrismaClient();

console.log('🔌 Connecting to production database...');
console.log('Database URL:', process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@')); // Hide password

// Top 50 countries by GDP/population
const TOP_COUNTRIES = [
  'US', 'CN', 'JP', 'DE', 'IN', 'GB', 'FR', 'IT', 'BR', 'CA',
  'KR', 'RU', 'AU', 'ES', 'MX', 'ID', 'NL', 'SA', 'TR', 'CH',
  'TW', 'BE', 'IE', 'IL', 'NO', 'AE', 'EG', 'NG', 'ZA', 'AR',
  'TH', 'SG', 'MY', 'PH', 'CL', 'PK', 'BD', 'VN', 'CO', 'PL',
  'SE', 'AT', 'DK', 'FI', 'CZ', 'PT', 'GR', 'NZ', 'HU', 'RO'
];

const CHALLENGE_TYPES = ['WORKOUT', 'MEAL', 'WARMUP_ROUTINE'];
const SUBMISSION_TYPES = ['WORKOUT', 'MEAL', 'WARMUP_ROUTINE'];
const SUBMISSION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];
const REVIEWER_STATUSES = ['ACTIVE', 'SUSPENDED'];

function getRandomCountry() {
  return TOP_COUNTRIES[Math.floor(Math.random() * TOP_COUNTRIES.length)];
}

function generateWalletAddress() {
  return '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function generateHandle() {
  const adjectives = ['Fit', 'Strong', 'Active', 'Healthy', 'Energetic', 'Power', 'Speed', 'Agile', 'Dynamic', 'Elite'];
  const nouns = ['Athlete', 'Champion', 'Warrior', 'Hero', 'Star', 'Master', 'Legend', 'Pro', 'Expert', 'Guru'];
  const numbers = Math.floor(Math.random() * 9999) + 1;
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${numbers}`;
}

async function seedTestData() {
  try {
    console.log('🌱 Starting to seed test data...');
    
    // Clean existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.review.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.reviewer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.xpTransaction.deleteMany();
    await prisma.treasuryTransaction.deleteMany();
    await prisma.referral.deleteMany();
    await prisma.adView.deleteMany();
    await prisma.userChallenge.deleteMany();
    await prisma.challenge.deleteMany();
    
    console.log('👥 Creating 500 users...');
    const users = [];
    for (let i = 0; i < 500; i++) {
      const country = getRandomCountry();
      const user = await prisma.user.create({
        data: {
          wallet: generateWalletAddress(),
          email: faker.internet.email(),
          handle: generateHandle(),
          country_code: country,
          xp_points: Math.floor(Math.random() * 10000),
          goal_points: Math.floor(Math.random() * 5000),
          current_streak: Math.floor(Math.random() * 30),
          burn_multiplier: 1 + Math.random() * 2,
          created_at: faker.date.past({ years: 1 }),
          updated_at: new Date()
        }
      });
      users.push(user);
      
      if ((i + 1) % 50 === 0) {
        console.log(`  Created ${i + 1} users...`);
      }
    }
    
    console.log('🎯 Creating challenges...');
    const challenges = [];
    for (let i = 0; i < 100; i++) {
      const challenge = await prisma.challenge.create({
        data: {
          title: faker.lorem.sentence(),
          description: faker.lorem.paragraph(),
          type: CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)],
          xp_reward: Math.floor(Math.random() * 100) + 10,
          goal_reward: Math.floor(Math.random() * 50) + 5,
          start_date: faker.date.past({ months: 3 }),
          end_date: faker.date.future({ years: 1 }),
          is_active: Math.random() > 0.2,
          created_at: faker.date.past({ months: 6 }),
          updated_at: new Date()
        }
      });
      challenges.push(challenge);
    }
    
    console.log('📝 Creating user challenges...');
    for (let i = 0; i < 1000; i++) {
      await prisma.userChallenge.create({
        data: {
          user_id: users[Math.floor(Math.random() * users.length)].id,
          challenge_id: challenges[Math.floor(Math.random() * challenges.length)].id,
          status: Math.random() > 0.3 ? 'COMPLETED' : 'IN_PROGRESS',
          completed_at: Math.random() > 0.3 ? faker.date.past({ months: 1 }) : null,
          created_at: faker.date.past({ months: 2 }),
          updated_at: new Date()
        }
      });
    }
    
    console.log('💰 Creating XP transactions...');
    for (let i = 0; i < 2000; i++) {
      await prisma.xpTransaction.create({
        data: {
          user_id: users[Math.floor(Math.random() * users.length)].id,
          xp_points: Math.floor(Math.random() * 200) + 10,
          goal_points: Math.floor(Math.random() * 100) + 5,
          transaction_type: 'CHALLENGE_COMPLETED',
          created_at: faker.date.past({ months: 6 })
        }
      });
    }
    
    console.log('🏦 Creating treasury transactions...');
    for (let i = 0; i < 500; i++) {
      await prisma.treasuryTransaction.create({
        data: {
          amount_usdt: Math.random() * 1000 + 50,
          amount_goalcoin: Math.random() * 10000 + 500,
          transaction_type: Math.random() > 0.5 ? 'DEPOSIT' : 'BURN',
          created_at: faker.date.past({ months: 6 })
        }
      });
    }
    
    console.log('👥 Creating referrals...');
    for (let i = 0; i < 200; i++) {
      const referrer = users[Math.floor(Math.random() * users.length)];
      const referred = users[Math.floor(Math.random() * users.length)];
      
      if (referrer.id !== referred.id) {
        await prisma.referral.create({
          data: {
            referrer_id: referrer.id,
            referred_id: referred.id,
            status: 'COMPLETED',
            reward_points: Math.floor(Math.random() * 100) + 50,
            created_at: faker.date.past({ months: 3 })
          }
        });
      }
    }
    
    console.log('👁️ Creating ad views...');
    for (let i = 0; i < 3000; i++) {
      await prisma.adView.create({
        data: {
          user_id: users[Math.floor(Math.random() * users.length)].id,
          ad_type: ['BANNER', 'VIDEO', 'POPUP'][Math.floor(Math.random() * 3)],
          reward_points: Math.floor(Math.random() * 10) + 1,
          created_at: faker.date.past({ months: 1 })
        }
      });
    }
    
    console.log('👥 Creating reviewers...');
    const reviewers = [];
    const reviewerUsers = users.slice(0, 50); // Use first 50 users as reviewers
    
    for (let i = 0; i < reviewerUsers.length; i++) {
      const reviewer = await prisma.reviewer.create({
        data: {
          id: reviewerUsers[i].id,
          user_id: reviewerUsers[i].id,
          voting_weight: Math.floor(Math.random() * 3) + 1,
          strikes: Math.floor(Math.random() * 3),
          status: REVIEWER_STATUSES[Math.floor(Math.random() * REVIEWER_STATUSES.length)],
          created_at: faker.date.past({ months: 6 }),
          updated_at: new Date()
        }
      });
      reviewers.push(reviewer);
    }
    
    console.log('📤 Creating submissions...');
    const submissions = [];
    for (let i = 0; i < 300; i++) {
      const avatarIds = [14, 38, 68, 100];
      const randomAvatarId = avatarIds[Math.floor(Math.random() * avatarIds.length)];
      
      const submission = await prisma.submission.create({
        data: {
          user_id: users[Math.floor(Math.random() * users.length)].id,
          challenge_id: challenges[Math.floor(Math.random() * challenges.length)].id,
          week_no: Math.floor(Math.random() * 12) + 1,
          file_url: `https://avatar.iran.liara.run/public/${randomAvatarId}`,
          watermark_code: `WM${String(i + 1).padStart(6, '0')}`,
          status: SUBMISSION_STATUSES[Math.floor(Math.random() * SUBMISSION_STATUSES.length)],
          created_at: faker.date.past({ months: 2 })
        }
      });
      submissions.push(submission);
    }
    
    console.log('🔍 Creating reviews...');
    for (let i = 0; i < 600; i++) {
      const submission = submissions[Math.floor(Math.random() * submissions.length)];
      const reviewer = reviewers[Math.floor(Math.random() * reviewers.length)];
      const vote = Math.random() > 0.2 ? 'APPROVE' : 'REJECT';
      
      await prisma.review.create({
        data: {
          submission_id: submission.id,
          reviewer_wallet: reviewer.user.wallet,
          vote: vote,
          comment: faker.lorem.sentence(),
          created_at: faker.date.past({ months: 1 })
        }
      });
    }
    
    console.log('📋 Creating audit logs...');
    for (let i = 0; i < 500; i++) {
      const reviewer = reviewers[Math.floor(Math.random() * reviewers.length)];
      const actions = ['STATUS_CHANGE', 'STRIKE_ADDED', 'STRIKE_RESET', 'REVIEWER_ADDED', 'REVIEWER_REMOVED'];
      
      await prisma.auditLog.create({
        data: {
          reviewer_id: reviewer.id,
          action: actions[Math.floor(Math.random() * actions.length)],
          details: faker.lorem.sentence(),
          created_at: faker.date.past({ months: 3 })
        }
      });
    }
    
    console.log('✅ Test data seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Challenges: ${challenges.length}`);
    console.log(`  - User Challenges: 1000`);
    console.log(`  - XP Transactions: 2000`);
    console.log(`  - Treasury Transactions: 500`);
    console.log(`  - Referrals: 200`);
    console.log(`  - Ad Views: 3000`);
    console.log(`  - Reviewers: ${reviewers.length}`);
    console.log(`  - Submissions: ${submissions.length}`);
    console.log(`  - Reviews: 600`);
    console.log(`  - Audit Logs: 500`);
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();
