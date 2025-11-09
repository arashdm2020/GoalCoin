import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * XP award rate limiter
 * 50 requests per 5 minutes per IP
 */
export const xpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  message: 'Too many XP requests, please slow down.',
});

/**
 * Content interaction rate limiter
 * 100 requests per 10 minutes per IP
 */
export const contentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100,
  message: 'Too many content interactions, please slow down.',
});

/**
 * Admin endpoint rate limiter
 * 200 requests per 15 minutes per IP
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many admin requests, please slow down.',
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
