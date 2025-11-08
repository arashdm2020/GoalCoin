import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Debug endpoint to check Prisma schema
router.get('/schema-check', async (req, res) => {
  try {
    // Try to create a test user with all fields
    const testWallet = '0xdebug' + Date.now();
    
    const user = await prisma.user.create({
      data: {
        wallet: testWallet,
        xp_points: 0,
        goal_points: 0,
        current_streak: 0,
        longest_streak: 0,
        burn_multiplier: 1.0,
        is_holder: false,
        micro_goal_points: 0,
        last_activity_date: new Date(),
      },
    });

    // Delete the test user
    await prisma.user.delete({ where: { id: user.id } });

    res.json({ 
      success: true, 
      message: 'Schema is correct',
      fields: Object.keys(user),
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
  }
});

// Test connect endpoint
router.post('/test-connect', async (req, res) => {
  try {
    const testWallet = '0xtest' + Date.now();
    
    const user = await prisma.user.upsert({
      where: { wallet: testWallet },
      update: {
        last_activity_date: new Date(),
      },
      create: {
        wallet: testWallet,
        xp_points: 0,
        goal_points: 0,
        current_streak: 0,
        longest_streak: 0,
        burn_multiplier: 1.0,
        is_holder: false,
        micro_goal_points: 0,
        last_activity_date: new Date(),
      },
    });

    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      code: error.code,
    });
  }
});

export { router as debugRoutes };
