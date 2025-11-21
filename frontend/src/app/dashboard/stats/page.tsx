'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTierDisplayName, getTierColor, getTierIcon } from '@/utils/tierMapping';

interface UserStats {
  user: {
    handle: string;
    email: string;
    wallet: string | null;
    tier: string;
    fan_tier: string;
    xp_points: number;
    current_streak: number;
    longest_streak: number;
    burn_multiplier: number;
    created_at: string;
    country_code?: string;
  };
  tier_progress: {
    currentTier: string;
    nextTier: string | null;
    xpPoints: number;
    progress: number;
    xpNeeded: number;
  };
  rankings: {
    global_rank: number;
    country_rank: number;
    total_users: number;
  };
  activity: {
    total_workouts: number;
    total_meals_logged: number;
    total_warmups: number;
    last_activity: string;
  };
}

export default function UserStatsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      
      // Fetch user profile using auth/me endpoint
      const profileRes = await fetch(`${backendUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!profileRes.ok) {
        if (profileRes.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          router.push('/auth');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const profileData = await profileRes.json();

      // Fetch real activity data
      const [warmupHistory, mealHistory, workoutHistory] = await Promise.all([
        fetch(`${backendUrl}/api/warmups/history?limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.ok ? res.json() : { history: [] }),
        
        fetch(`${backendUrl}/api/meals/history?limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.ok ? res.json() : { history: [] }),
        
        fetch(`${backendUrl}/api/fitness/progress/${profileData.user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.ok ? res.json() : { workouts: [] })
      ]);

      // Get rankings from leaderboard
      const [globalLeaderboard, countryLeaderboard] = await Promise.all([
        fetch(`${backendUrl}/api/leaderboard?scope=global`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.ok ? res.json() : { leaderboard: [] }),
        
        fetch(`${backendUrl}/api/leaderboard?scope=country&country=${profileData.user.country_code}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.ok ? res.json() : { leaderboard: [] })
      ]);

      // Calculate rankings
      const globalRank = globalLeaderboard.leaderboard?.findIndex((user: any) => 
        user.wallet === profileData.user.wallet || user.handle === profileData.user.handle
      ) + 1 || 0;

      const countryRank = countryLeaderboard.leaderboard?.findIndex((user: any) => 
        user.wallet === profileData.user.wallet || user.handle === profileData.user.handle
      ) + 1 || 0;

      // Determine tier based on XP if fan_tier is not set
      const userTier = profileData.user.fan_tier || determineTierFromXP(profileData.user.xp_points || 0);
      
      const realStats: UserStats = {
        user: profileData.user,
        tier_progress: {
          currentTier: userTier,
          nextTier: getNextTier(userTier),
          xpPoints: profileData.user.xp_points || 0,
          progress: calculateProgress(profileData.user.xp_points || 0, userTier),
          xpNeeded: calculateXPNeeded(profileData.user.xp_points || 0, userTier),
        },
        rankings: {
          global_rank: globalRank || 999,
          country_rank: countryRank || 99,
          total_users: globalLeaderboard.leaderboard?.length || 0,
        },
        activity: {
          total_workouts: workoutHistory.workouts?.length || 0,
          total_meals_logged: mealHistory.history?.length || 0,
          total_warmups: warmupHistory.history?.length || 0,
          last_activity: new Date().toISOString(),
        },
      };

      setStats(realStats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const determineTierFromXP = (xp: number): string => {
    if (xp >= 50000) return 'APEX';
    if (xp >= 15000) return 'ASCENDANT';
    if (xp >= 5000) return 'VERIFIED';
    if (xp >= 1000) return 'STAKED';
    return 'MINTED';
  };

  const getNextTier = (currentTier: string): string | null => {
    const tiers = ['MINTED', 'STAKED', 'VERIFIED', 'ASCENDANT', 'APEX'];
    const index = tiers.indexOf(currentTier);
    return index < tiers.length - 1 ? tiers[index + 1] : null;
  };

  const calculateProgress = (xp: number, tier: string): number => {
    const thresholds: Record<string, { min: number; max: number }> = {
      MINTED: { min: 0, max: 999 },
      STAKED: { min: 1000, max: 4999 },
      VERIFIED: { min: 5000, max: 14999 },
      ASCENDANT: { min: 15000, max: 49999 },
      APEX: { min: 50000, max: 999999 },
    };

    // Handle null/undefined tier
    if (!tier || !thresholds[tier]) {
      tier = 'MINTED';
    }

    const range = thresholds[tier];
    if (!range) return 0;

    // Ensure xp is a valid number
    const validXP = isNaN(xp) ? 0 : xp;
    
    const progress = ((validXP - range.min) / (range.max - range.min)) * 100;
    const finalProgress = Math.min(Math.max(progress, 0), 100);
    
    // Return 0 if result is NaN
    return isNaN(finalProgress) ? 0 : finalProgress;
  };

  const calculateXPNeeded = (xp: number, tier: string): number => {
    const thresholds: Record<string, number> = {
      MINTED: 1000,
      STAKED: 5000,
      VERIFIED: 15000,
      ASCENDANT: 50000,
      APEX: 0,
    };

    // Handle null/undefined tier
    if (!tier || !thresholds[tier]) {
      tier = 'MINTED';
    }

    const nextThreshold = thresholds[tier];
    const validXP = isNaN(xp) ? 0 : xp;
    const needed = Math.max(nextThreshold - validXP, 0);
    
    return isNaN(needed) ? 0 : needed;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading your stats...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Failed to load stats'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-gray-800/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold">Your Statistics</h1>
                <p className="text-sm text-gray-400">@{stats.user.handle}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Profile Overview */}
        <section className="mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
            <div className="flex items-center gap-6">
              <div className="text-6xl">
                {getTierIcon(stats.user.fan_tier)}
              </div>
              <div className="flex-1">
                <h2 className={`text-3xl font-bold ${getTierColor(stats.user.fan_tier)}`}>
                  {getTierDisplayName(stats.user.fan_tier)}
                </h2>
                <p className="text-gray-400 mt-1">
                  Member since {new Date(stats.user.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-6 mt-4">
                  <div>
                    <p className="text-sm text-gray-400">XP Points</p>
                    <p className="text-2xl font-bold text-yellow-500">{stats.user.xp_points.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Current Streak</p>
                    <p className="text-2xl font-bold text-orange-500">{stats.user.current_streak} 🔥</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Longest Streak</p>
                    <p className="text-2xl font-bold text-purple-500">{stats.user.longest_streak} 🏆</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tier Progress */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-white">Tier Progress</h2>
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            {stats.tier_progress.nextTier ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Current Tier</p>
                    <p className="text-lg font-bold">{stats.tier_progress.currentTier}</p>
                  </div>
                  <div className="text-gray-500">→</div>
                  <div>
                    <p className="text-sm text-gray-400">Next Tier</p>
                    <p className="text-lg font-bold">{stats.tier_progress.nextTier}</p>
                  </div>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-4 mb-2">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${stats.tier_progress.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400 text-center">
                  {stats.tier_progress.xpNeeded.toLocaleString()} XP needed for next tier
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">👑</p>
                <p className="text-lg font-bold text-yellow-500">You've reached the highest tier!</p>
                <p className="text-sm text-gray-400 mt-2">Keep earning XP to maintain your position</p>
              </div>
            )}
          </div>
        </section>

        {/* Rankings */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-white">Rankings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400 mb-2">Global Rank</p>
              <p className="text-4xl font-bold text-yellow-500">#{stats.rankings.global_rank}</p>
              <p className="text-xs text-gray-500 mt-2">out of {stats.rankings.total_users.toLocaleString()}</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400 mb-2">Country Rank</p>
              <p className="text-4xl font-bold text-blue-500">#{stats.rankings.country_rank}</p>
              <p className="text-xs text-gray-500 mt-2">{stats.user.country_code || 'N/A'}</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400 mb-2">Burn Multiplier</p>
              <p className="text-4xl font-bold text-orange-500">{(stats.user.burn_multiplier || 1).toFixed(2)}x</p>
              <p className="text-xs text-gray-500 mt-2">Tier bonus</p>
            </div>
          </div>
        </section>

        {/* Activity Stats */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-white">Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Total Workouts</p>
                <span className="text-2xl">💪</span>
              </div>
              <p className="text-3xl font-bold">{stats.activity.total_workouts}</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Meals Logged</p>
                <span className="text-2xl">🍽️</span>
              </div>
              <p className="text-3xl font-bold">{stats.activity.total_meals_logged}</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Warmups Done</p>
                <span className="text-2xl">🔥</span>
              </div>
              <p className="text-3xl font-bold">{stats.activity.total_warmups}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
