'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  streak_active: boolean;
}

export default function StreakPage() {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStreakData();
  }, []);

  const fetchStreakData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://goalcoin.onrender.com';
      
      const response = await fetch(`${backendUrl}/api/streak/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStreakData(data);
      }
    } catch (error) {
      console.error('Error fetching streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStreak = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://goalcoin.onrender.com';
      
      const response = await fetch(`${backendUrl}/api/streak/update`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStreakData(data);
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading streak data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold">⚡ Streak Tracker</h1>
            </div>
            <button
              onClick={updateStreak}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
            >
              Update Streak
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-500/50 rounded-xl p-8 mb-8 text-center">
          <div className="text-8xl mb-4">⚡</div>
          <h2 className="text-6xl font-bold text-yellow-400 mb-2">
            {streakData?.current_streak || 0}
          </h2>
          <p className="text-2xl text-gray-300 mb-4">Day Streak</p>
          {streakData?.streak_active ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-semibold">Active Streak</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-full">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-red-400 font-semibold">Streak Broken</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <div className="text-sm text-gray-400">Current Streak</div>
                <div className="text-3xl font-bold text-yellow-400">{streakData?.current_streak || 0}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">Days in a row</div>
          </div>

          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <div className="text-sm text-gray-400">Longest Streak</div>
                <div className="text-3xl font-bold text-orange-400">{streakData?.longest_streak || 0}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">Personal best</div>
          </div>

          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <div className="text-sm text-gray-400">Last Activity</div>
                <div className="text-lg font-bold text-blue-400">
                  {streakData?.last_activity_date 
                    ? new Date(streakData.last_activity_date).toLocaleDateString()
                    : 'No activity yet'}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">Most recent</div>
          </div>
        </div>

        {/* How Streaks Work */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">How Streaks Work</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-green-400">✓</span>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Complete Daily Activities</h4>
                <p className="text-gray-400 text-sm">Log workouts, warm-ups, or meals to maintain your streak</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-yellow-400">⚡</span>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Build Momentum</h4>
                <p className="text-gray-400 text-sm">Each consecutive day adds to your streak counter</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-orange-400">🏆</span>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Earn Bonuses</h4>
                <p className="text-gray-400 text-sm">Longer streaks unlock XP multipliers and special rewards</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-red-400">⚠</span>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Don't Break It</h4>
                <p className="text-gray-400 text-sm">Missing a day resets your streak to 0 - stay consistent!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Streak Milestones */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Streak Milestones</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg border-2 ${(streakData?.current_streak || 0) >= 7 ? 'bg-green-500/10 border-green-500' : 'bg-gray-800/50 border-gray-700'}`}>
              <div className="text-3xl mb-2">🔥</div>
              <div className="font-bold text-white">7 Days</div>
              <div className="text-xs text-gray-400">Week Warrior</div>
            </div>

            <div className={`p-4 rounded-lg border-2 ${(streakData?.current_streak || 0) >= 30 ? 'bg-green-500/10 border-green-500' : 'bg-gray-800/50 border-gray-700'}`}>
              <div className="text-3xl mb-2">⭐</div>
              <div className="font-bold text-white">30 Days</div>
              <div className="text-xs text-gray-400">Month Master</div>
            </div>

            <div className={`p-4 rounded-lg border-2 ${(streakData?.current_streak || 0) >= 60 ? 'bg-green-500/10 border-green-500' : 'bg-gray-800/50 border-gray-700'}`}>
              <div className="text-3xl mb-2">💎</div>
              <div className="font-bold text-white">60 Days</div>
              <div className="text-xs text-gray-400">Diamond Dedication</div>
            </div>

            <div className={`p-4 rounded-lg border-2 ${(streakData?.current_streak || 0) >= 90 ? 'bg-green-500/10 border-green-500' : 'bg-gray-800/50 border-gray-700'}`}>
              <div className="text-3xl mb-2">👑</div>
              <div className="font-bold text-white">90 Days</div>
              <div className="text-xs text-gray-400">Challenge Champion</div>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
