'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
// Icons removed for now to avoid dependency issues

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

interface UserData {
  id: string;
  handle: string;
  email: string;
  wallet: string;
  country_code: string;
  tier: string;
  fan_tier?: string;
  payment_tier?: string;
  xp_points: number;
  goal_points: number;
  current_streak: number;
  longest_streak: number;
  burn_multiplier: number;
  is_holder: boolean;
  micro_goal_points: number;
  email_verified: boolean;
  created_at: string;
  last_activity_date?: string;
}

interface UserStats {
  totalSubmissions: number;
  approvedSubmissions: number;
  pendingSubmissions: number;
  rejectedSubmissions: number;
  totalWarmups: number;
  totalWorkouts: number;
  totalMeals: number;
  successRate: number;
}

interface XPLog {
  id: string;
  action_type: string;
  xp_earned: number;
  description: string;
  created_at: string;
  metadata?: any;
}

interface StreakLog {
  id: string;
  date: string;
  streak_count: number;
  action: string;
  reason?: string;
}

export default function UserDetailPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [xpLogs, setXpLogs] = useState<XPLog[]>([]);
  const [streakLogs, setStreakLogs] = useState<StreakLog[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'xp' | 'streak'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) {
        router.push('/admin/login');
        return;
      }

      // Fetch user details
      const userResponse = await fetch(`${getBackendUrl()}/api/admin/users/${userId}`, {
        headers: { 'Authorization': authHeader }
      });

      if (userResponse.status === 401) {
        localStorage.removeItem('admin_auth_header');
        router.push('/admin/login');
        return;
      }

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await userResponse.json();
      setUser(userData.user || userData);

      // Fetch user statistics
      const statsResponse = await fetch(`${getBackendUrl()}/api/admin/users/${userId}/stats`, {
        headers: { 'Authorization': authHeader }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || statsData);
      }

      // Fetch XP logs
      const xpResponse = await fetch(`${getBackendUrl()}/api/admin/users/${userId}/xp-logs`, {
        headers: { 'Authorization': authHeader }
      });

      if (xpResponse.ok) {
        const xpData = await xpResponse.json();
        setXpLogs(xpData.logs || []);
      }

      // Fetch streak logs
      const streakResponse = await fetch(`${getBackendUrl()}/api/admin/users/${userId}/streak-logs`, {
        headers: { 'Authorization': authHeader }
      });

      if (streakResponse.ok) {
        const streakData = await streakResponse.json();
        setStreakLogs(streakData.logs || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error || 'User not found'}</div>
          <button
            onClick={() => router.push('/admin/leaderboard')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Leaderboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/leaderboard')}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              ←
              <span>Back to Leaderboard</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-white">User Details</h1>
        </div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Basic Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              👤
              <h2 className="text-xl font-semibold text-white">Basic Information</h2>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-gray-300">Handle:</span>
                <span className="text-white ml-2 font-medium">{user.handle || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-300">Email:</span>
                <span className="text-white ml-2 font-medium">{user.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-300">Tier:</span>
                <span className="text-yellow-400 ml-2 font-medium">{user.tier}</span>
              </div>
              {user.payment_tier && (
                <div>
                  <span className="text-gray-300">Payment Tier:</span>
                  <span className="text-green-400 ml-2 font-medium">${user.payment_tier}</span>
                </div>
              )}
              {user.fan_tier && (
                <div>
                  <span className="text-gray-300">Fan Tier:</span>
                  <span className="text-blue-400 ml-2 font-medium">{user.fan_tier}</span>
                </div>
              )}
              <div>
                <span className="text-gray-300">Country:</span>
                {user.country_code ? (
                  <span className="text-white ml-2 font-medium inline-flex items-center gap-2">
                    <img 
                      src={`https://flagsapi.com/${user.country_code}/flat/32.png`}
                      alt={user.country_code}
                      className="w-6 h-4 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {user.country_code}
                  </span>
                ) : (
                  <span className="text-white ml-2 font-medium">N/A</span>
                )}
              </div>
              <div>
                <span className="text-gray-300">Email Verified:</span>
                <span className={`ml-2 font-medium ${user.email_verified ? 'text-green-400' : 'text-red-400'}`}>
                  {user.email_verified ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Wallet Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              💰
              <h2 className="text-xl font-semibold text-white">Wallet & Holdings</h2>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-gray-300">Wallet:</span>
                <div className="text-white font-mono text-sm mt-1 break-all">
                  {user.wallet || 'Not connected'}
                </div>
              </div>
              <div>
                <span className="text-gray-300">Holder Status:</span>
                <span className={`ml-2 font-medium ${user.is_holder ? 'text-green-400' : 'text-gray-400'}`}>
                  {user.is_holder ? 'Token Holder' : 'Non-Holder'}
                </span>
              </div>
              <div>
                <span className="text-gray-300">Burn Multiplier:</span>
                <span className="text-orange-400 ml-2 font-medium">{user.burn_multiplier}x</span>
              </div>
            </div>
          </div>

          {/* Activity Dates */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              📅
              <h2 className="text-xl font-semibold text-white">Activity Timeline</h2>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-gray-300">Joined:</span>
                <div className="text-white mt-1">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
              {user.last_activity_date && (
                <div>
                  <span className="text-gray-300">Last Activity:</span>
                  <div className="text-white mt-1">
                    {new Date(user.last_activity_date).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Points & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-white">{user.xp_points.toLocaleString()}</div>
            <div className="text-gray-300">XP Points</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-white">{user.goal_points.toLocaleString()}</div>
            <div className="text-gray-300">Goal Points</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="text-2xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-white">{user.current_streak}</div>
            <div className="text-gray-300">Current Streak</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <div className="text-2xl mb-2">🏅</div>
            <div className="text-2xl font-bold text-white">{user.longest_streak}</div>
            <div className="text-gray-300">Longest Streak</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2 border-b border-white/20">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('xp')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'xp'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🏆 XP Logs ({xpLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('streak')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'streak'
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🔥 Streak History ({streakLogs.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center space-x-3 mb-4">
                📋
                <h2 className="text-xl font-semibold text-white">Submissions</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total:</span>
                  <span className="text-white font-medium">{stats.totalSubmissions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Approved:</span>
                  <span className="text-green-400 font-medium">{stats.approvedSubmissions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Pending:</span>
                  <span className="text-yellow-400 font-medium">{stats.pendingSubmissions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Rejected:</span>
                  <span className="text-red-400 font-medium">{stats.rejectedSubmissions}</span>
                </div>
                <div className="flex justify-between border-t border-white/20 pt-3">
                  <span className="text-gray-300">Success Rate:</span>
                  <span className="text-white font-medium">{stats.successRate}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center space-x-3 mb-4">
                📊
                <h2 className="text-xl font-semibold text-white">Activity Logs</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Warmups:</span>
                  <span className="text-blue-400 font-medium">{stats.totalWarmups}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Workouts:</span>
                  <span className="text-purple-400 font-medium">{stats.totalWorkouts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Meals:</span>
                  <span className="text-green-400 font-medium">{stats.totalMeals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Micro Goal Points:</span>
                  <span className="text-orange-400 font-medium">{user.micro_goal_points}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* XP Logs Tab */}
        {activeTab === 'xp' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">XP Transaction History</h2>
              <div className="text-gray-300">Total: {user.xp_points.toLocaleString()} XP</div>
            </div>
            
            {xpLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No XP logs found for this user
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {xpLogs.map((log) => (
                  <div key={log.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-semibold text-yellow-400">+{log.xp_earned} XP</span>
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                            {log.action_type}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{log.description}</p>
                        <div className="text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <details className="text-xs text-gray-400">
                          <summary className="cursor-pointer hover:text-white">Metadata</summary>
                          <pre className="mt-2 p-2 bg-black/30 rounded overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Streak History Tab */}
        {activeTab === 'streak' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Streak Timeline</h2>
              <div className="text-gray-300">
                Current: {user.current_streak} days | Longest: {user.longest_streak} days
              </div>
            </div>
            
            {streakLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No streak logs found for this user
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {streakLogs.map((log) => (
                  <div key={log.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-semibold text-orange-400">
                            {log.action === 'break' ? '💔' : '🔥'} {log.streak_count} days
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            log.action === 'break' 
                              ? 'bg-red-500/20 text-red-300' 
                              : 'bg-green-500/20 text-green-300'
                          }`}>
                            {log.action}
                          </span>
                        </div>
                        {log.reason && (
                          <p className="text-gray-300 text-sm mb-2">{log.reason}</p>
                        )}
                        <div className="text-xs text-gray-500">
                          {new Date(log.date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
