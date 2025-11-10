'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      
      // Fetch user profile
      const profileRes = await fetch(`${backendUrl}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!profileRes.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileData = await profileRes.json();

      // Mock additional stats (you can add real endpoints later)
      const mockStats: UserStats = {
        user: profileData.user,
        tier_progress: {
          currentTier: profileData.user.fan_tier || 'MINTED',
          nextTier: getNextTier(profileData.user.fan_tier),
          xpPoints: profileData.user.xp_points || 0,
          progress: calculateProgress(profileData.user.xp_points, profileData.user.fan_tier),
          xpNeeded: calculateXPNeeded(profileData.user.xp_points, profileData.user.fan_tier),
        },
        rankings: {
          global_rank: Math.floor(Math.random() * 1000) + 1,
          country_rank: Math.floor(Math.random() * 100) + 1,
          total_users: 5000,
        },
        activity: {
          total_workouts: Math.floor(Math.random() * 50),
          total_meals_logged: Math.floor(Math.random() * 100),
          total_warmups: Math.floor(Math.random() * 30),
          last_activity: new Date().toISOString(),
        },
      };

      setStats(mockStats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

    const range = thresholds[tier];
    if (!range) return 0;

    const progress = ((xp - range.min) / (range.max - range.min)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const calculateXPNeeded = (xp: number, tier: string): number => {
    const thresholds: Record<string, number> = {
      MINTED: 1000,
      STAKED: 5000,
      VERIFIED: 15000,
      ASCENDANT: 50000,
      APEX: 0,
    };

    const nextThreshold = thresholds[tier];
    return Math.max(nextThreshold - xp, 0);
  };

  const getTierIcon = (tier: string): string => {
    const icons: Record<string, string> = {
      MINTED: '🌱',
      STAKED: '💪',
      VERIFIED: '🏆',
      ASCENDANT: '⭐',
      APEX: '👑',
    };
    return icons[tier] || '🌱';
  };

  const getTierColor = (tier: string): string => {
    const colors: Record<string, string> = {
      MINTED: 'text-gray-400',
      STAKED: 'text-green-400',
      VERIFIED: 'text-blue-400',
      ASCENDANT: 'text-purple-400',
      APEX: 'text-yellow-400',
    };
    return colors[tier] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p>Loading your stats...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Failed to load stats'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-yellow-500 text-black rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-yellow-500">📊 Your Stats</h1>
            <p className="text-sm text-gray-400 mt-1">@{stats.user.handle}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Profile Overview */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-8 border border-gray-700">
            <div className="flex items-center gap-6">
              <div className="text-6xl">
                {getTierIcon(stats.user.fan_tier)}
              </div>
              <div className="flex-1">
                <h2 className={`text-3xl font-bold ${getTierColor(stats.user.fan_tier)}`}>
                  {stats.user.fan_tier}
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
          <h2 className="text-xl font-bold mb-4 text-yellow-500">Tier Progress</h2>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
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
          <h2 className="text-xl font-bold mb-4 text-yellow-500">Rankings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 text-center">
              <p className="text-sm text-gray-400 mb-2">Global Rank</p>
              <p className="text-4xl font-bold text-yellow-500">#{stats.rankings.global_rank}</p>
              <p className="text-xs text-gray-500 mt-2">out of {stats.rankings.total_users.toLocaleString()}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 text-center">
              <p className="text-sm text-gray-400 mb-2">Country Rank</p>
              <p className="text-4xl font-bold text-blue-500">#{stats.rankings.country_rank}</p>
              <p className="text-xs text-gray-500 mt-2">{stats.user.country_code || 'N/A'}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 text-center">
              <p className="text-sm text-gray-400 mb-2">Burn Multiplier</p>
              <p className="text-4xl font-bold text-orange-500">{stats.user.burn_multiplier.toFixed(2)}x</p>
              <p className="text-xs text-gray-500 mt-2">Tier bonus</p>
            </div>
          </div>
        </section>

        {/* Activity Stats */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-yellow-500">Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Total Workouts</p>
                <span className="text-2xl">💪</span>
              </div>
              <p className="text-3xl font-bold">{stats.activity.total_workouts}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Meals Logged</p>
                <span className="text-2xl">🍽️</span>
              </div>
              <p className="text-3xl font-bold">{stats.activity.total_meals_logged}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
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
