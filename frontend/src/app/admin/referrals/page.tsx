'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ReferralStats {
  total_referrals: number;
  monthly_referrals: number;
  activated_referrals: number;
  conversion_rate: number;
  top_referrers_count: number;
}

interface LeaderboardEntry {
  rank: number;
  handle: string;
  wallet: string;
  referral_count: number;
  active_referrals: number;
}

export default function AdminReferralsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('current');

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/admin/login');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const adminToken = localStorage.getItem('admin_token');
      const authHeader = `Basic ${adminToken}`;

      // Fetch admin stats
      const statsRes = await fetch(`${backendUrl}/api/referrals/admin/stats`, {
        headers: { Authorization: authHeader },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch leaderboard
      const leaderboardRes = await fetch(`${backendUrl}/api/referrals/leaderboard`, {
        headers: { Authorization: authHeader },
      });
      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json();
        setLeaderboard(leaderboardData.leaderboard || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-gray-400 hover:text-white mb-4"
          >
            ← Back to Admin Dashboard
          </button>
          <h1 className="text-4xl font-bold mb-2">🏆 Referral Management</h1>
          <p className="text-gray-400">Monitor referral performance and monthly winners</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl font-bold text-blue-400">{stats.total_referrals}</div>
              <div className="text-sm text-gray-400 mt-1">Total Referrals</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl font-bold text-green-400">{stats.monthly_referrals}</div>
              <div className="text-sm text-gray-400 mt-1">This Month</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl font-bold text-purple-400">{stats.activated_referrals}</div>
              <div className="text-sm text-gray-400 mt-1">Activated</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl font-bold text-yellow-400">{stats.conversion_rate.toFixed(1)}%</div>
              <div className="text-sm text-gray-400 mt-1">Conversion Rate</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl font-bold text-orange-400">{stats.top_referrers_count}</div>
              <div className="text-sm text-gray-400 mt-1">Top Referrers</div>
            </div>
          </div>
        )}

        {/* Monthly Prize Info */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">💰 Monthly Prize: $100 USD</h2>
              <p className="text-yellow-100">Winner announced at the end of each month</p>
            </div>
            <div className="text-5xl">🏆</div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">🏅 Current Month Leaderboard</h2>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              🔄 Refresh
            </button>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-xl text-gray-400">No referrals yet this month</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4">Rank</th>
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Wallet</th>
                    <th className="text-right py-3 px-4">Total Referrals</th>
                    <th className="text-right py-3 px-4">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr
                      key={entry.wallet}
                      className={`border-b border-gray-700 hover:bg-gray-700/50 ${
                        entry.rank <= 3 ? 'bg-yellow-900/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className={`text-xl font-bold ${
                          entry.rank === 1 ? 'text-yellow-400' :
                          entry.rank === 2 ? 'text-gray-400' :
                          entry.rank === 3 ? 'text-orange-600' :
                          'text-gray-500'
                        }`}>
                          #{entry.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{entry.handle || 'Anonymous'}</td>
                      <td className="py-3 px-4 font-mono text-sm text-gray-400">
                        {entry.wallet.slice(0, 8)}...{entry.wallet.slice(-6)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-400">
                        {entry.referral_count}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-green-400">
                        {entry.active_referrals}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
