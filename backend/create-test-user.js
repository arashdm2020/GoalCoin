const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Get DATABASE_URL from command line argument
const databaseUrl = process.argv[2];
if (!databaseUrl) {
  console.error('❌ Please provide DATABASE_URL as argument');
  console.log('Usage: node create-test-user.js "postgresql://user:pass@host/db"');
  process.exit(1);
}

process.env.DATABASE_URL = databaseUrl;
const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('Creating test user: testjames...');

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'testjames@goalcoin.com' },
          { handle: 'testjames' },
          { wallet: '0x742d35Cc6634C0532925a3b8D404d5B8c4c4c4c4' }
        ]
      }
    });

    if (existingUser) {
      console.log('Test user already exists:', existingUser.handle || existingUser.email);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('testpassword123', 10);

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'testjames@goalcoin.com',
        password_hash: hashedPassword,
        handle: 'testjames',
        wallet: '0x742d35Cc6634C0532925a3b8D404d5B8c4c4c4c4',
        country_code: 'US',
        email_verified: true,
        tier: 'PLAYER',
        founder_nft: false,
        xp_points: 2500,
        goal_points: 150,
        current_streak: 12,
        longest_streak: 25,
        burn_multiplier: 1.25,
        is_holder: true,
        micro_goal_points: 75,
        last_activity_date: new Date(),
        created_at: new Date('2024-01-15T10:00:00Z')
      }
    });

    console.log('✅ Test user created successfully!');
    console.log('📧 Email: testjames@goalcoin.com');
    console.log('🔑 Password: testpassword123');
    console.log('👤 Handle: testjames');
    console.log('💰 Wallet: 0x742d35Cc6634C0532925a3b8D404d5B8c4c4c4c4');
    console.log('🌍 Location: US (United States)');
    console.log('🏆 Tier: PLAYER');
    console.log('💎 XP Points: 2500');
    console.log('🔥 Current Streak: 12 days');
    console.log('📈 Burn Multiplier: 1.25x');
    
    // Add some sample activity data
    console.log('\nAdding sample activity data...');
    
    // Add some warmup logs
    for (let i = 0; i < 8; i++) {
      await prisma.warmupLog.create({
        data: {
          user_id: testUser.id,
          routine_id: `warmup_routine_${i + 1}`,
          duration_seconds: 300 + (i * 30),
          xp_earned: 25,
          completed_at: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
        }
      });
    }

    // Add some meal logs
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    for (let i = 0; i < 15; i++) {
      await prisma.mealLog.create({
        data: {
          user_id: testUser.id,
          meal_id: `meal_${i + 1}`,
          meal_type: mealTypes[i % 4],
          calories: 200 + (i * 20),
          xp_earned: 15,
          completed_at: new Date(Date.now() - (i * 12 * 60 * 60 * 1000))
        }
      });
    }

    // Add some workout logs
    for (let i = 0; i < 5; i++) {
      await prisma.workoutLog.create({
        data: {
          user_id: testUser.id,
          workout_type: i % 2 === 0 ? 'strength' : 'cardio',
          duration_min: 45 + (i * 5),
          xp_earned: 50,
          completed_at: new Date(Date.now() - (i * 48 * 60 * 60 * 1000))
        }
      });
    }

    // Add some submissions
    for (let i = 0; i < 3; i++) {
      await prisma.submission.create({
        data: {
          user_id: testUser.id,
          week_number: i + 1,
          proof_type: 'IMAGE',
          proof_url: `https://example.com/proof_${i + 1}.jpg`,
          status: i < 2 ? 'APPROVED' : 'PENDING',
          watermark_code: `WM${testUser.id}${i + 1}${Date.now()}`,
          created_at: new Date(Date.now() - ((3 - i) * 7 * 24 * 60 * 60 * 1000))
        }
      });
    }

    console.log('✅ Sample activity data added!');
    console.log('📊 Added: 8 warmups, 15 meals, 5 workouts, 3 submissions');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
