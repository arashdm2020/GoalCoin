import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createMainChallenge() {
  try {
    // Check if main challenge already exists
    const existing = await prisma.challenge.findUnique({
      where: { id: 'main-challenge' },
    });

    if (existing) {
      console.log('✅ Main challenge already exists:', existing.id);
      return;
    }

    // Create main challenge
    const challenge = await prisma.challenge.create({
      data: {
        id: 'main-challenge',
        title: '13-Week Transformation Challenge',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-31'),
        rules: 'Complete 13 weeks of fitness and nutrition goals',
        active: true,
      },
    });

    console.log('✅ Main challenge created successfully:', challenge.id);
  } catch (error) {
    console.error('❌ Failed to create main challenge:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMainChallenge();
