/**
 * Rate Limit Monitoring Service
 * Track and monitor rate limit violations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RateLimitViolation {
  ip: string;
  userId?: string;
  endpoint: string;
  timestamp: Date;
  requestCount: number;
  limit: number;
}

class RateLimitMonitorService {
  /**
   * Log rate limit violation
   */
  async logViolation(data: RateLimitViolation): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO rate_limit_violations (ip, user_id, endpoint, request_count, limit, created_at)
        VALUES (${data.ip}, ${data.userId || null}, ${data.endpoint}, ${data.requestCount}, ${data.limit}, NOW())
      `;
    } catch (error) {
      console.error('[Rate Limit Monitor] Error logging violation:', error);
    }
  }

  /**
   * Get violations by IP
   */
  async getViolationsByIP(ip: string, limit: number = 50): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT * FROM rate_limit_violations
      WHERE ip = ${ip}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Get recent violations
   */
  async getRecentViolations(hours: number = 24, limit: number = 100): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT 
        ip,
        user_id,
        endpoint,
        COUNT(*) as violation_count,
        MAX(created_at) as last_violation,
        SUM(request_count) as total_requests
      FROM rate_limit_violations
      WHERE created_at > NOW() - INTERVAL '${hours} hours'
      GROUP BY ip, user_id, endpoint
      ORDER BY violation_count DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Get top offenders
   */
  async getTopOffenders(limit: number = 20): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT 
        ip,
        COUNT(*) as total_violations,
        COUNT(DISTINCT endpoint) as endpoints_hit,
        MAX(created_at) as last_seen,
        ARRAY_AGG(DISTINCT endpoint) as endpoints
      FROM rate_limit_violations
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY ip
      ORDER BY total_violations DESC
      LIMIT ${limit}
    `;
  }

  /**
   * Get violations by endpoint
   */
  async getViolationsByEndpoint(hours: number = 24): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT 
        endpoint,
        COUNT(*) as violation_count,
        COUNT(DISTINCT ip) as unique_ips,
        AVG(request_count) as avg_requests
      FROM rate_limit_violations
      WHERE created_at > NOW() - INTERVAL '${hours} hours'
      GROUP BY endpoint
      ORDER BY violation_count DESC
    `;
  }

  /**
   * Check if IP is blocked
   */
  async isIPBlocked(ip: string): Promise<boolean> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 1 FROM blocked_ips
      WHERE ip = ${ip} AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `;
    return result.length > 0;
  }

  /**
   * Block IP
   */
  async blockIP(ip: string, reason: string, expiresInHours?: number): Promise<void> {
    const expiresAt = expiresInHours 
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : null;

    await prisma.$executeRaw`
      INSERT INTO blocked_ips (ip, reason, expires_at, created_at)
      VALUES (${ip}, ${reason}, ${expiresAt}, NOW())
      ON CONFLICT (ip) DO UPDATE SET
        reason = ${reason},
        expires_at = ${expiresAt},
        updated_at = NOW()
    `;
  }

  /**
   * Unblock IP
   */
  async unblockIP(ip: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM blocked_ips WHERE ip = ${ip}
    `;
  }

  /**
   * Get blocked IPs
   */
  async getBlockedIPs(): Promise<any[]> {
    return await prisma.$queryRaw`
      SELECT * FROM blocked_ips
      WHERE expires_at IS NULL OR expires_at > NOW()
      ORDER BY created_at DESC
    `;
  }

  /**
   * Get rate limit stats
   */
  async getStats(): Promise<any> {
    const [violations, blocked, topEndpoints] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT 
          COUNT(*) as total_violations,
          COUNT(DISTINCT ip) as unique_ips,
          COUNT(DISTINCT endpoint) as unique_endpoints
        FROM rate_limit_violations
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `,
      prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as blocked_count
        FROM blocked_ips
        WHERE expires_at IS NULL OR expires_at > NOW()
      `,
      prisma.$queryRaw<any[]>`
        SELECT endpoint, COUNT(*) as count
        FROM rate_limit_violations
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY endpoint
        ORDER BY count DESC
        LIMIT 5
      `
    ]);

    return {
      last24Hours: violations[0],
      blockedIPs: blocked[0].blocked_count,
      topEndpoints
    };
  }

  /**
   * Clean old violations (older than 30 days)
   */
  async cleanOldViolations(): Promise<number> {
    const result = await prisma.$executeRaw`
      DELETE FROM rate_limit_violations
      WHERE created_at < NOW() - INTERVAL '30 days'
    `;
    return result;
  }
}

export const rateLimitMonitorService = new RateLimitMonitorService();
