/**
 * Country Leaderboard Service - EWBI Formula Implementation
 * Formula: Country_Score = Σ(User_XP × StreakMult) / √(ActiveUsers + BufferFactor)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CountryStats {
  country_code: string;
  total_xp: bigint;
  active_users: number;
  country_score: number;
  season: string;
  rank?: number;
}

interface UserContribution {
  xp_contributed: number;
  country_code: string;
}

class CountryLeaderboardService {
  /**
   * Update country stats when user earns XP
   */
  async updateCountryStats(userId: string, xpEarned: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country_code: true, current_streak: true }
    });

    if (!user?.country_code) return;

    // Calculate weighted XP with streak multiplier
    const weeks = Math.floor(user.current_streak / 7);
    const streakBonus = Math.min(weeks * 0.02, 0.10);
    const streakMultiplier = 1.0 + streakBonus;
    const weightedXP = Math.floor(xpEarned * streakMultiplier);

    // Update country stats
    await prisma.$executeRaw`
      INSERT INTO country_stats (country_code, total_xp, active_users, country_score)
      VALUES (${user.country_code}, ${weightedXP}, 1, 0)
      ON CONFLICT (country_code)
      DO UPDATE SET
        total_xp = country_stats.total_xp + ${weightedXP},
        last_updated = NOW()
    `;

    // Log daily contribution
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.$executeRaw`
      INSERT INTO country_contributions (user_id, country_code, xp_contributed, contribution_date)
      VALUES (${userId}, ${user.country_code}, ${xpEarned}, ${today})
      ON CONFLICT (user_id, contribution_date)
      DO UPDATE SET xp_contributed = country_contributions.xp_contributed + ${xpEarned}
    `;

    // Recalculate score
    await this.recalculateCountryScore(user.country_code);
  }

  /**
   * Recalculate EWBI score for a country
   */
  async recalculateCountryScore(countryCode: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE country_stats
      SET country_score = calculate_country_score(country_code, buffer_factor)
      WHERE country_code = ${countryCode}
    `;
  }

  /**
   * Get global leaderboard
   */
  async getGlobalLeaderboard(limit: number = 10, season?: string): Promise<CountryStats[]> {
    const seasonFilter = season || 'SEASON_1';
    
    const results = await prisma.$queryRaw<CountryStats[]>`
      SELECT 
        country_code,
        total_xp,
        active_users,
        country_score,
        season,
        rank
      FROM country_leaderboard
      WHERE season = ${seasonFilter}
      ORDER BY rank
      LIMIT ${limit}
    `;

    return results;
  }

  /**
   * Get user's country rank
   */
  async getUserCountryRank(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country_code: true }
    });

    if (!user?.country_code) return null;

    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        country_code,
        total_xp,
        active_users,
        country_score,
        rank
      FROM country_leaderboard
      WHERE country_code = ${user.country_code}
    `;

    if (stats.length === 0) return null;

    return {
      country: user.country_code,
      rank: stats[0].rank,
      score: stats[0].country_score,
      totalXP: Number(stats[0].total_xp),
      activeUsers: stats[0].active_users
    };
  }

  /**
   * Get user's daily contribution message
   */
  async getDailyContribution(userId: string): Promise<string | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const contribution = await prisma.$queryRaw<UserContribution[]>`
      SELECT xp_contributed, country_code
      FROM country_contributions
      WHERE user_id = ${userId} AND contribution_date = ${today}
    `;

    if (contribution.length === 0) return null;

    const countryName = this.getCountryName(contribution[0].country_code);
    return `🔥 You added +${contribution[0].xp_contributed} XP to ${countryName} today!`;
  }

  /**
   * Update active user counts (run daily via cron)
   */
  async updateActiveUserCounts(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Update active user counts for all countries
    await prisma.$executeRaw`
      UPDATE country_stats cs
      SET active_users = (
        SELECT COUNT(DISTINCT u.id)
        FROM users u
        WHERE u.country_code = cs.country_code
          AND u.last_activity_date >= ${thirtyDaysAgo}
      ),
      last_updated = NOW()
    `;

    // Refresh materialized view
    await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY country_leaderboard`;
  }

  /**
   * Get country name from code
   */
  private getCountryName(code: string): string {
    const countries: Record<string, string> = {
      'NG': 'Nigeria',
      'US': 'United States',
      'GB': 'United Kingdom',
      'IN': 'India',
      'BR': 'Brazil',
      'ZA': 'South Africa',
      'KE': 'Kenya',
      'GH': 'Ghana',
      'CA': 'Canada',
      'AU': 'Australia',
      'DE': 'Germany',
      'FR': 'France',
      'ES': 'Spain',
      'IT': 'Italy',
      'MX': 'Mexico',
      'AR': 'Argentina',
      'EG': 'Egypt',
      'PH': 'Philippines',
      'ID': 'Indonesia',
      'PK': 'Pakistan'
    };
    return countries[code] || code;
  }

  /**
   * Get top countries by region
   */
  async getRegionalLeaderboard(region: string, limit: number = 10): Promise<CountryStats[]> {
    const regionCountries = this.getRegionCountries(region);
    
    const results = await prisma.$queryRaw<CountryStats[]>`
      SELECT 
        country_code,
        total_xp,
        active_users,
        country_score,
        season,
        rank
      FROM country_leaderboard
      WHERE country_code = ANY(${regionCountries})
      ORDER BY rank
      LIMIT ${limit}
    `;

    return results;
  }

  /**
   * Get countries by region
   */
  private getRegionCountries(region: string): string[] {
    const regions: Record<string, string[]> = {
      'AFR': ['NG', 'ZA', 'KE', 'GH', 'EG', 'TZ', 'UG', 'ET', 'MA', 'DZ'],
      'AMER': ['US', 'BR', 'CA', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC'],
      'EUAS': ['GB', 'DE', 'FR', 'ES', 'IT', 'IN', 'PH', 'ID', 'PK', 'AU', 'RU', 'TR', 'PL', 'UA']
    };
    return regions[region] || [];
  }

  /**
   * Admin: Update buffer factor
   */
  async updateBufferFactor(countryCode: string, bufferFactor: number): Promise<void> {
    await prisma.$executeRaw`
      UPDATE country_stats
      SET buffer_factor = ${bufferFactor}
      WHERE country_code = ${countryCode}
    `;

    await this.recalculateCountryScore(countryCode);
  }

  /**
   * Admin: Update global buffer factor
   */
  async updateGlobalBufferFactor(bufferFactor: number): Promise<void> {
    await prisma.$executeRaw`
      UPDATE country_stats
      SET buffer_factor = ${bufferFactor}
    `;

    // Recalculate all scores
    const countries = await prisma.$queryRaw<{ country_code: string }[]>`
      SELECT country_code FROM country_stats
    `;

    for (const country of countries) {
      await this.recalculateCountryScore(country.country_code);
    }
  }
}

export const countryLeaderboardService = new CountryLeaderboardService();
