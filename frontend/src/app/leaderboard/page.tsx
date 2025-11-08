'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LeaderboardEntry {
  wallet?: string;
  handle?: string;
  country_code?: string;
  tier: string;
  total_submissions: number;
  approved_submissions: number;
  success_rate: number;
}

export default function LeaderboardPage() {
  const [scope, setScope] = useState<'global' | 'country'>('global');
  const [country, setCountry] = useState('');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.country_code) {
      setCountry(user.country_code);
    }

    fetchLeaderboard();
  }, [scope, country, router]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const params = new URLSearchParams({ scope });
      if (scope === 'country' && country) {
        params.append('country', country);
      }

      const response = await fetch(`${backendUrl}/api/leaderboard?${params}`);
      const data = await response.json();
      setEntries(data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'FOUNDER':
        return 'text-purple-400';
      case 'PLAYER':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#FFD700]">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-[#FFD700] transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">🏆 Leaderboard</h1>
          <p className="text-gray-400 text-lg">
            See who's leading the challenge
          </p>
        </div>

        {/* Scope Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setScope('global')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              scope === 'global'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            🌍 Global
          </button>
          <button
            onClick={() => setScope('country')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              scope === 'country'
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            🚩 My Country
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading leaderboard...</div>
        ) : (
          <div className="max-w-6xl mx-auto bg-gray-900 border border-[#FFD700]/20 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Country</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Tier</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Submissions</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Approved</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                        No entries yet. Be the first!
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry, index) => (
                      <tr
                        key={entry.wallet}
                        className={`border-t border-gray-800 ${
                          index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <span
                            className={`text-lg font-bold ${
                              index === 0
                                ? 'text-yellow-400'
                                : index === 1
                                ? 'text-gray-300'
                                : index === 2
                                ? 'text-orange-400'
                                : 'text-gray-400'
                            }`}
                          >
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">
                            {entry.handle || (entry.wallet ? entry.wallet.slice(0, 10) + '...' : 'Anonymous')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {entry.country_code || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold ${getTierColor(entry.tier)}`}>
                            {entry.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{entry.total_submissions}</td>
                        <td className="px-6 py-4 text-sm text-green-400">
                          {entry.approved_submissions}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-sm font-medium ${
                              entry.success_rate >= 80
                                ? 'text-green-400'
                                : entry.success_rate >= 50
                                ? 'text-yellow-400'
                                : 'text-red-400'
                            }`}
                          >
                            {entry.success_rate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
