import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { cacheService } from '../services/cacheService';

const router = Router();
const prisma = new PrismaClient();

// Health check endpoint
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = {
      status: 'healthy',
      responseTime: Date.now() - startTime + 'ms'
    };
  } catch (error: any) {
    health.database = {
      status: 'unhealthy',
      error: error.message
    };
    health.status = 'degraded';
  }

  // Check Redis cache
  try {
    const cacheStats = await cacheService.getStats();
    health.cache = cacheStats;
  } catch (error: any) {
    health.cache = {
      status: 'unavailable',
      error: error.message
    };
  }

  // Memory usage
  const memUsage = process.memoryUsage();
  health.memory = {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
  };

  // Response time
  health.responseTime = Date.now() - startTime + 'ms';

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Detailed metrics endpoint
router.get('/metrics', async (req: Request, res: Response): Promise<void> => {
  try {
    // User stats
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        last_activity_date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // XP stats
    const xpEvents = await prisma.$queryRaw<[{ count: bigint, total_xp: bigint }]>`
      SELECT COUNT(*) as count, SUM(xp_final) as total_xp
      FROM xp_events
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `;

    // Content stats
    const contentInteractions = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM content_interactions
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `;

    res.json({
      users: {
        total: totalUsers,
        active30d: activeUsers,
        activeRate: ((activeUsers / totalUsers) * 100).toFixed(2) + '%'
      },
      xp: {
        events24h: Number(xpEvents[0].count),
        totalXP24h: Number(xpEvents[0].total_xp)
      },
      content: {
        interactions24h: Number(contentInteractions[0].count)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as healthRoutes };
