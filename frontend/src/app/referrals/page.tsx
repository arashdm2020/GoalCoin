'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LeaderboardEntry {
  rank: number;
  handle: string;
  wallet: string;
  referral_count: number;
  active_referrals: number;
  is_current_user: boolean;
}

interface PrizeInfo {
  month: string;
  prize_amount: number;
  winner?: {
    handle: string;
    wallet: string;
    referral_count: number;
  };
  announced: boolean;
}

interface UserStats {
  total_referrals: number;
  active_referrals: number;
  pending_referrals: number;
  total_rewards: number;
  current_rank: number | null;
}

export default function ReferralsPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [prizeInfo, setPrizeInfo] = useState<PrizeInfo | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem('token');
      const wallet = localStorage.getItem('wallet');
      
      // Fetch leaderboard
      const leaderboardRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/referrals/leaderboard`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const leaderboardData = await leaderboardRes.json();
      setLeaderboard(leaderboardData.leaderboard || []);

      // Fetch prize info
      const prizeRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/referrals/prize`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const prizeData = await prizeRes.json();
      setPrizeInfo(prizeData);

      // Fetch user stats
      const statsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/referrals/my-stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const statsData = await statsRes.json();
      setUserStats(statsData);

      // Set referral link
      setReferralLink(`${window.location.origin}/signup?ref=${wallet}`);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading referral data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold mb-2">🏆 Referral Leaderboard</h1>
          <p className="text-gray-400">Invite friends and compete for monthly prizes</p>
        </div>

        {/* Prize Banner */}
        {prizeInfo && (
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">💰 Monthly Prize: ${prizeInfo.prize_amount}</h2>
                <p className="text-yellow-100">
                  {prizeInfo.announced && prizeInfo.winner
                    ? `🎉 Winner: ${prizeInfo.winner.handle} with ${prizeInfo.winner.referral_count} referrals!`
                    : `Compete this month (${prizeInfo.month}) to win!`}
                </p>
              </div>
              <div className="text-5xl">🏆</div>
            </div>
          </div>
        )}

        {/* User Stats */}
        {userStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-500">{userStats.total_referrals}</div>
              <div className="text-sm text-gray-400">Total Referrals</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-500">{userStats.active_referrals}</div>
              <div className="text-sm text-gray-400">Active</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-500">{userStats.pending_referrals}</div>
              <div className="text-sm text-gray-400">Pending</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-500">
                {userStats.current_rank ? `#${userStats.current_rank}` : 'N/A'}
              </div>
              <div className="text-sm text-gray-400">Your Rank</div>
            </div>
          </div>
        )}

        {/* Share Referral Link */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h3 className="text-xl font-bold mb-4">📤 Share Your Referral Link</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
            />
            <button
              onClick={copyReferralLink}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
            >
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-6">🏅 Top Referrers</h3>
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div
                key={entry.wallet}
                className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                  entry.is_current_user
                    ? 'bg-blue-900 border-2 border-blue-500'
                    : 'bg-gray-900 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold ${
                    entry.rank === 1 ? 'text-yellow-500' :
                    entry.rank === 2 ? 'text-gray-400' :
                    entry.rank === 3 ? 'text-orange-600' :
                    'text-gray-500'
                  }`}>
                    #{entry.rank}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {entry.handle || `${entry.wallet.slice(0, 6)}...${entry.wallet.slice(-4)}`}
                      {entry.is_current_user && <span className="ml-2 text-blue-400">(You)</span>}
                    </div>
                    <div className="text-sm text-gray-400">
                      {entry.active_referrals} active / {entry.referral_count} total
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{entry.referral_count}</div>
                  <div className="text-sm text-gray-400">referrals</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
