'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email?: string;
  wallet?: string;
  handle?: string;
  tier: string;
  xp_points: number;
  goal_points: number;
  current_streak: number;
  longest_streak: number;
  burn_multiplier: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth');
        return;
      }

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
        const response = await fetch(`${backendUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Unauthorized');
        }

        const data = await response.json();
        
        // Check if profile is complete
        if (!data.user.wallet || !data.user.handle || !data.user.country_code) {
          router.push('/complete-profile');
          return;
        }
        
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem('auth_token');
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-[#FFD700] flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const needsPayment = user.tier === 'FAN';

  return (
    <div className="min-h-screen bg-black text-[#FFD700]">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">GoalCoin Dashboard</h1>
          <div className="flex items-center gap-4">
            {user.wallet && (
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border border-[#FFD700]/30 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">Wallet</span>
                  <span className="text-sm font-mono text-[#FFD700]">
                    {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
                  </span>
                </div>
                <div className="h-8 w-px bg-gray-700"></div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">Balance</span>
                  <span className="text-sm font-semibold text-green-400">
                    {user.goal_points} GOAL
                  </span>
                </div>
              </div>
            )}
            {!user.wallet && (
              <button
                onClick={() => router.push('/link-wallet')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                🔗 Connect Wallet
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Active Tier Display */}
        {!needsPayment && (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">✅ Active Challenge</h2>
                <p className="text-gray-300">
                  You're enrolled in the 90-Day Challenge as <span className="text-[#FFD700] font-semibold">{user.tier}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Burn Multiplier</div>
                <div className="text-3xl font-bold text-green-400">{user.burn_multiplier}×</div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Required Banner */}
        {needsPayment && (
          <div className="mb-8 p-6 bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 border border-[#FFD700]/30 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">🚀 Join the 90-Day Challenge!</h2>
            <p className="text-gray-300 mb-4">
              Choose your tier and start your transformation journey
            </p>
            <Link
              href="/checkout"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Choose Your Tier →
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">XP Points</div>
            <div className="text-3xl font-bold">{user.xp_points}</div>
          </div>

          <div className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">Current Streak</div>
            <div className="text-3xl font-bold">{user.current_streak} 🔥</div>
          </div>

          <div className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">Tier</div>
            <div className="text-3xl font-bold">{user.tier}</div>
          </div>

          <div className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-2">Burn Multiplier</div>
            <div className="text-3xl font-bold">{user.burn_multiplier}x</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/warmup"
            className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-6 hover:border-[#FFD700]/50 transition-colors"
          >
            <h3 className="text-xl font-semibold mb-2">🔥 Warm-Up</h3>
            <p className="text-gray-400 text-sm">Complete daily warm-up routines</p>
          </Link>

          <Link
            href="/fitness/workout"
            className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-6 hover:border-[#FFD700]/50 transition-colors"
          >
            <h3 className="text-xl font-semibold mb-2">💪 Workout</h3>
            <p className="text-gray-400 text-sm">Log your workout session</p>
          </Link>

          <Link
            href="/meals"
            className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-6 hover:border-[#FFD700]/50 transition-colors"
          >
            <h3 className="text-xl font-semibold mb-2">🍽️ Meal Plan</h3>
            <p className="text-gray-400 text-sm">Log your daily meals & track nutrition</p>
          </Link>

          <Link
            href="/submit"
            className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-6 hover:border-[#FFD700]/50 transition-colors"
          >
            <h3 className="text-xl font-semibold mb-2">📸 Weekly Proof</h3>
            <p className="text-gray-400 text-sm">Submit your weekly progress</p>
          </Link>

          <Link
            href="/leaderboard"
            className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-6 hover:border-[#FFD700]/50 transition-colors"
          >
            <h3 className="text-xl font-semibold mb-2">🏆 Leaderboard</h3>
            <p className="text-gray-400 text-sm">See global rankings</p>
          </Link>

          <Link
            href="/referrals"
            className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-6 hover:border-[#FFD700]/50 transition-colors"
          >
            <h3 className="text-xl font-semibold mb-2">🎁 Referrals</h3>
            <p className="text-gray-400 text-sm">Invite friends & win prizes</p>
          </Link>

          <Link
            href="/shopify-redeem"
            className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-6 hover:border-[#FFD700]/50 transition-colors"
          >
            <h3 className="text-xl font-semibold mb-2">🎁 Redeem Code</h3>
            <p className="text-gray-400 text-sm">Redeem Shopify order code</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
