const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestReviewers() {
  try {
    console.log('Adding test reviewers...');

    // Create test users first
    const testUsers = [
      {
        wallet: '0x1234567890123456789012345678901234567890',
        email: 'reviewer1@goalcoin.app',
        handle: 'reviewer1'
      },
      {
        wallet: '0x2345678901234567890123456789012345678901',
        email: 'reviewer2@goalcoin.app',
        handle: 'reviewer2'
      },
      {
        wallet: '0x3456789012345678901234567890123456789012',
        email: 'reviewer3@goalcoin.app',
        handle: 'reviewer3'
      }
    ];

    for (const userData of testUsers) {
      // Create or update user
      const user = await prisma.user.upsert({
        where: { wallet: userData.wallet },
        update: {},
        create: {
          wallet: userData.wallet,
          email: userData.email,
          handle: userData.handle,
          xp_points: 0,
          goal_points: 0,
          current_streak: 0,
          longest_streak: 0,
          burn_multiplier: 1.0,
          is_holder: false,
          micro_goal_points: 0,
          last_activity_date: new Date(),
        }
      });

      // Create reviewer
      const reviewer = await prisma.reviewer.upsert({
        where: { user_id: user.id },
        update: {},
        create: {
          user_id: user.id,
          voting_weight: 1,
          strikes: 0,
          status: 'ACTIVE'
        }
      });

      console.log(`✅ Created reviewer: ${userData.handle} (${userData.wallet})`);
    }

    console.log('✅ Test reviewers added successfully!');
  } catch (error) {
    console.error('❌ Error adding test reviewers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestReviewers();
