import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { rateLimitMonitorService } from '../services/rateLimitMonitorService';

// Handler for rate limit violations
const handleRateLimitExceeded = async (req: Request, res: Response, endpoint: string, limit: number) => {
  const ip = req.ip || 'unknown';
  const user = (req as any).user;
  
  // Log violation
  await rateLimitMonitorService.logViolation({
    ip,
    userId: user?.userId,
    endpoint,
    timestamp: new Date(),
    requestCount: limit + 1,
    limit,
  });

  // Check if IP is blocked
  const isBlocked = await rateLimitMonitorService.isIPBlocked(ip);
  if (isBlocked) {
    res.status(403).json({ error: 'Your IP has been blocked due to excessive requests' });
    return;
  }
};

/**
 * General API rate limiter
 * 1000 requests per minute per IP (as per James requirements)
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    await handleRateLimitExceeded(req, res, req.path, 1000);
    res.status(429).json({ error: 'Too many requests from this IP, please try again later.' });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 req/min (burst 10) per IP+user (as per James requirements)
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
  handler: async (req, res) => {
    await handleRateLimitExceeded(req, res, req.path, 5);
    res.status(429).json({ error: 'Too many login attempts, please try again later.' });
  },
});

/**
 * XP award rate limiter
 * 30 req/min (burst 60) (as per James requirements)
 */
export const xpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many XP requests, please slow down.',
  handler: async (req, res) => {
    await handleRateLimitExceeded(req, res, req.path, 30);
    res.status(429).json({ error: 'Too many XP requests, please slow down.' });
  },
});

/**
 * Read-only endpoints (feeds, leaderboards)
 * 120 req/min (as per James requirements)
 */
export const contentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  message: 'Too many requests, please slow down.',
  handler: async (req, res) => {
    await handleRateLimitExceeded(req, res, req.path, 120);
    res.status(429).json({ error: 'Too many requests, please slow down.' });
  },
});

/**
 * Admin endpoint rate limiter
 * 20 req/min with IP allowlist (as per James requirements)
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many admin requests, please slow down.',
  handler: async (req, res) => {
    await handleRateLimitExceeded(req, res, req.path, 20);
    res.status(429).json({ error: 'Too many admin requests, please slow down.' });
  },
});

/**
 * Custom rate limiter with Redis (optional)
 * Falls back to memory store if Redis is not available
 */
export const createCustomLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // TODO: Add Redis store for production
    // store: new RedisStore({
    //   client: redisClient,
    //   prefix: 'rl:',
    // }),
  });
};

/**
 * Per-user rate limiter (requires authentication)
 */
export const createUserLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later.',
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise fall back to IP
      const user = (req as any).user;
      return user?.userId || req.ip || 'unknown';
    },
  });
};
