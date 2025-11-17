'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTierDisplayName } from '@/utils/tierMapping';

interface LeaderboardEntry {
  wallet?: string;
  handle?: string;
  country_code?: string;
  tier: string;
  total_submissions: number;
  approved_submissions: number;
  success_rate: number;
  xp_points?: number;
  current_streak?: number;
  rank?: number;
  is_current_user?: boolean;
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
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth');
        return;
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      
      const params = new URLSearchParams({ scope });
      if (scope === 'country' && user.country_code) {
        params.append('country', user.country_code);
      }

      const response = await fetch(`${backendUrl}/api/leaderboard?${params}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.leaderboard) {
        // Mark current user in the leaderboard
        const leaderboardWithCurrentUser = data.leaderboard.map((entry: any, index: number) => ({
          ...entry,
          rank: index + 1,
          is_current_user: entry.wallet === user.wallet || entry.handle === user.handle,
          success_rate: entry.total_submissions > 0 ? 
            (entry.approved_submissions / entry.total_submissions) * 100 : 0
        }));
        
        setEntries(leaderboardWithCurrentUser);
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    // Map fan tiers
    const tierUpper = tier?.toUpperCase();
    switch (tierUpper) {
      case 'APEX':
        return 'text-red-500';
      case 'ASCENDANT':
        return 'text-purple-400';
      case 'VERIFIED':
        return 'text-blue-400';
      case 'STAKED':
        return 'text-green-400';
      case 'MINTED':
        return 'text-yellow-400';
      case 'FOUNDER':
        return 'text-purple-600';
      case 'PLAYER':
        return 'text-blue-500';
      default:
        return 'text-gray-400';
    }
  };

  const getTierDisplay = (tier: string) => {
    // Display new tier names (Minted, Staked, etc.)
    return getTierDisplayName(tier);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <header className="bg-black/50 backdrop-blur-md border-b border-gray-800/50">
        <div className="container mx-auto px-6 py-4">
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
              <h1 className="text-xl font-bold">Leaderboard</h1>
              <p className="text-sm text-gray-400">See who's leading the challenge</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">

        {/* Scope Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setScope('global')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              scope === 'global'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-900/50 text-gray-400 hover:text-white hover:bg-gray-800/50 border border-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Global</span>
          </button>
          <button
            onClick={() => setScope('country')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              scope === 'country'
                ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg'
                : 'bg-gray-900/50 text-gray-400 hover:text-white hover:bg-gray-800/50 border border-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            <span>My Country</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Country</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Tier</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">XP Points</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Submissions</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Success Rate</th>
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
                        key={entry.wallet || entry.handle}
                        className={`border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                          entry.is_current_user ? 'bg-blue-900/20 border-blue-500/30' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
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
                              #{entry.rank || index + 1}
                            </span>
                            {index === 0 && <span className="text-yellow-400">👑</span>}
                            {entry.is_current_user && <span className="text-blue-400 text-xs">(You)</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
                              {(entry.handle || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className={`font-medium ${entry.is_current_user ? 'text-blue-400' : 'text-white'}`}>
                                {entry.handle || (entry.wallet ? entry.wallet.slice(0, 10) + '...' : 'Anonymous')}
                              </div>
                              {entry.current_streak && (
                                <div className="text-xs text-orange-400">
                                  🔥 {entry.current_streak} day streak
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {entry.country_code ? (
                            <div className="flex items-center gap-2">
                              <img 
                                src={`https://flagcdn.com/w20/${entry.country_code.toLowerCase()}.png`}
                                alt={entry.country_code}
                                className="w-5 h-4 object-cover rounded"
                              />
                              <span className="text-gray-400">{entry.country_code}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold px-2 py-1 rounded-full ${getTierColor(entry.tier)} bg-opacity-20`}>
                            {entry.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-blue-400">
                            {entry.xp_points?.toLocaleString() || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <span className="text-green-400">{entry.approved_submissions}</span>
                            <span className="text-gray-500">/{entry.total_submissions}</span>
                          </div>
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
