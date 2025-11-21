'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTierDisplayName } from '@/utils/tierMapping';
import { getTierBadge, getBurnMultiplier, getStreakCap, isStakedMember } from '@/utils/tierUtils';
import { getCountryName } from '@/utils/countryUtils';
import '@/styles/dashboard.css';
import { isIOS, lockScroll, unlockScroll } from '@/utils/iosHelpers';
import '@/styles/ios.css';

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
  challenge_start_date?: string;
  payment_tier?: string;
}

interface LeaderboardEntry {
  rank: number;
  handle: string;
  xp_points: number;
  country_code?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: any;
  created_at: string;
}


export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [challengeDay, setChallengeDay] = useState<number>(0);
  const [leaderboardPage, setLeaderboardPage] = useState<number>(1);
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
        
        // Calculate challenge day
        if (data.user.challenge_start_date) {
          const startDate = new Date(data.user.challenge_start_date);
          const today = new Date();
          const diffTime = today.getTime() - startDate.getTime();
          const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          setChallengeDay(Math.min(diffDays, 90));
        } else {
          // If no start date, use account creation date
          const createdDate = new Date(data.user.created_at);
          const today = new Date();
          const diffTime = today.getTime() - createdDate.getTime();
          const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          setChallengeDay(Math.min(diffDays, 90));
        }
        
        // Fetch real notifications
        fetchNotifications(token, backendUrl);
        
        // Fetch leaderboard preview
        fetchLeaderboardPreview(token, backendUrl);
      } catch (error) {
        localStorage.removeItem('auth_token');
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const fetchNotifications = async (token: string, backendUrl: string) => {
    try {
      console.log('[DASHBOARD] Fetching notifications from:', `${backendUrl}/api/notifications?limit=10`);
      const response = await fetch(`${backendUrl}/api/notifications?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('[DASHBOARD] Notifications response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[DASHBOARD] Notifications data:', data);
        console.log('[DASHBOARD] Notifications count:', data.notifications?.length || 0);
        setNotifications(data.notifications || []);
      } else {
        console.error('[DASHBOARD] Failed to fetch notifications:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[DASHBOARD] Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const fetchLeaderboardPreview = async (token: string, backendUrl: string) => {
    try {
      // Fetch top 20 for pagination (4 pages of 5 each)
      const response = await fetch(`${backendUrl}/api/leaderboard?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('[DASHBOARD] Error fetching leaderboard:', error);
      setLeaderboard([]);
    }
  };

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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* PWA Install Button - Temporarily disabled */}
      
      {/* Modern Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-gray-800/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center font-bold text-black">
                G
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">GoalCoin</h1>
                <p className="text-xs text-gray-400">Welcome back, {user.handle}</p>
              </div>
            </div>

            {/* Navigation Icons */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zm-7.5-1.5a6.5 6.5 0 1113 0c0 1.18-.561 2.229-1.432 2.895L12 23l-7.068-4.605A3.5 3.5 0 013.5 15.5z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="ios-notification-drawer bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col">
                      <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                        <div>
                          <h3 className="font-semibold text-white">Notifications</h3>
                          {unreadCount > 0 && (
                            <p className="text-xs text-gray-400">{unreadCount} unread</p>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => {
                              const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
                              setNotifications(updatedNotifications);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto flex-1 custom-scrollbar ios-scroll">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-400">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div 
                              key={notification.id} 
                              className={`p-4 border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-900/20 border-l-2 border-l-blue-500' : ''}`}
                              onClick={() => {
                                const updatedNotifications = notifications.map(n => 
                                  n.id === notification.id ? { ...n, read: true } : n
                                );
                                setNotifications(updatedNotifications);
                              }}
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm text-white truncate">{notification.title}</h4>
                                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">{notification.message}</p>
                                  <span className="text-gray-500 text-xs mt-1 inline-block">
                                    {notification.created_at ? new Date(notification.created_at).toLocaleString() : 'Just now'}
                                  </span>
                                </div>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-700 flex-shrink-0">
                          <button
                            onClick={() => {
                              setShowNotifications(false);
                              router.push('/notifications');
                            }}
                            className="w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            View all notifications
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Messages */}
              <button 
                onClick={() => router.push('/messages')}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
                    {user.handle?.charAt(0).toUpperCase()}
                  </div>
                </button>

                {/* Profile Dropdown */}
                {showProfile && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
                    <div className="p-4 border-b border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold">
                          {user.handle?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold">{user.handle}</h3>
                          <p className="text-sm text-gray-400">{user.tier} Member</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => router.push('/profile')}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        Profile Settings
                      </button>
                      <button
                        onClick={() => router.push('/profile#wallet')}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        Wallet Settings
                      </button>
                      <hr className="my-2 border-gray-700" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white">Good morning, {user.handle}!</h2>
              <p className="text-gray-400 mt-1">Ready to crush your goals today?</p>
            </div>
            {user.wallet && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-xs text-gray-400">GC Balance</p>
                    <p className="text-lg font-bold text-green-400">{user.goal_points} GC</p>
                  </div>
                  <div className="h-8 w-px bg-gray-600"></div>
                  <div>
                    <p className="text-xs text-gray-400">Address</p>
                    <p className="text-sm font-mono text-gray-300">
                      {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Challenge Status */}
        {!needsPayment && (
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/50 rounded-lg p-6 hover:border-green-400 transition-all mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400 text-sm font-medium">90-Day Challenge Active</span>
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-white font-bold text-lg">Enrolled as {user.tier} member</p>
                {user.payment_tier && (
                  <p className="text-sm text-gray-400 mt-1">Payment Tier: {user.payment_tier}</p>
                )}
              </div>
              {challengeDay > 0 && (
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">Day {challengeDay}</div>
                  <div className="text-sm text-gray-400">of 90</div>
                  <div className="mt-2 w-32 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${(challengeDay / 90) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              {/* Tier Badge */}
              {user.payment_tier && (
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    isStakedMember(user.payment_tier) 
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30' 
                      : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {getTierBadge(user.payment_tier)}
                  </span>
                  {isStakedMember(user.payment_tier) && (
                    <span className="text-xs text-purple-400">Early Access: Phase 2 Guaranteed</span>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Burn Multiplier:</span>
                <span className="text-2xl font-bold text-orange-400">🔥 {getBurnMultiplier(user.payment_tier) || 1.0}x</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Current Streak:</span>
                <span className="text-2xl font-bold text-yellow-400">⚡ {user.current_streak || 0}/{getStreakCap(user.payment_tier) || 7} days</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Required Banner */}
        {needsPayment && (
          <div className="mb-8 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Join the 90-Day Challenge</h3>
                  <p className="text-gray-300 mb-3">Choose your tier and start your transformation journey</p>
                  <Link
                    href="/checkout"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Get Started
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">XP</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{user.xp_points.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Experience Points</div>
            <Link href="/dashboard/xp-logs" className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block">
              View History →
            </Link>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">DAYS</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{user.current_streak}</div>
            <div className="text-sm text-gray-400">Current Streak</div>
            <Link href="/streak" className="text-xs text-orange-400 hover:text-orange-300 mt-2 inline-block">
              View Details →
            </Link>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">TIER</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{user.tier}</div>
            <div className="text-sm text-gray-400">Membership Level</div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">MULT</span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{user.burn_multiplier}×</div>
            <div className="text-sm text-gray-400">Burn Multiplier</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
          <div className="quick-actions-grid">
            <Link
              href="/warmup"
              className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all duration-300 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center group-hover:bg-orange-500/30 transition-colors flex-shrink-0">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 716.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0720 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white group-hover:text-orange-400 transition-colors">Warm-Up</h4>
                <p className="text-sm text-gray-400">Complete daily warm-up routines</p>
              </div>
            </Link>

            <Link
              href="/fitness/workout"
              className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300 flex items-center gap-4"
            >
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">Workout</h4>
                  <p className="text-sm text-gray-400">Log your workout session</p>
                </div>
            </Link>

            <Link
              href="/meals"
              className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-green-500/50 hover:bg-green-500/5 transition-all duration-300 flex items-center gap-4"
            >
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors flex-shrink-0">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white group-hover:text-green-400 transition-colors">Meal Plan</h4>
                  <p className="text-sm text-gray-400">Log your daily meals & track nutrition</p>
                </div>
            </Link>

            <Link
              href="/submit"
              className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300 flex items-center gap-4"
            >
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white group-hover:text-purple-400 transition-colors">Weekly Proof</h4>
                  <p className="text-sm text-gray-400">Submit your weekly progress</p>
                </div>
            </Link>

            <Link
              href="/leaderboard"
              className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all duration-300 flex items-center gap-4"
            >
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white group-hover:text-yellow-400 transition-colors">Leaderboard</h4>
                  <p className="text-sm text-gray-400">See global rankings</p>
                </div>
            </Link>

            <Link
              href="/referrals"
              className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-pink-500/50 hover:bg-pink-500/5 transition-all duration-300 flex items-center gap-4"
            >
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center group-hover:bg-pink-500/30 transition-colors flex-shrink-0">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white group-hover:text-pink-400 transition-colors">Referrals</h4>
                  <p className="text-sm text-gray-400">Invite friends and earn</p>
                </div>
            </Link>

            {/* Shopify Redeem - Hidden for Beta */}
            {/* <Link href="/shopify-redeem">...</Link> */}

            <Link
              href="/dashboard/stats"
              className="group bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/60 hover:from-yellow-500/20 hover:to-orange-500/20 transition-all duration-300 flex items-center gap-4"
            >
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-yellow-400 group-hover:text-yellow-300 transition-colors">My Stats</h4>
                  <p className="text-sm text-gray-400">View your detailed statistics</p>
                </div>
            </Link>
          </div>
        </div>

        {/* Weekly Tips Section */}
        {user && user.payment_tier && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    💡 Weekly Tips
                    {isStakedMember(user.payment_tier) && (
                      <span className="ml-2 text-xs px-2 py-1 bg-purple-500/30 text-purple-300 rounded-full border border-purple-500/50">
                        Premium
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-400">Expert advice for your fitness journey</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
                  <h4 className="font-semibold text-purple-300 mb-2">🎯 This Week's Focus</h4>
                  <p className="text-sm text-gray-300">
                    Focus on progressive overload - increase weight or reps by 5-10% each week. 
                    Track your numbers to ensure consistent progress.
                  </p>
                </div>
                
                <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
                  <h4 className="font-semibold text-purple-300 mb-2">🍽️ Nutrition Tip</h4>
                  <p className="text-sm text-gray-300">
                    Aim for 0.8-1g of protein per pound of body weight. 
                    Spread intake across 4-5 meals for optimal muscle recovery.
                  </p>
                </div>
                
                {isStakedMember(user.payment_tier) && (
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/30">
                    <h4 className="font-semibold text-purple-300 mb-2">⭐ Premium Insight</h4>
                    <p className="text-sm text-gray-300">
                      Time your carbs around workouts for maximum performance. 
                      Consume 30-50g of fast-acting carbs 30 minutes pre-workout for energy boost.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-xs text-gray-500 text-center">
                Tips updated weekly • Curated by certified trainers
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Preview */}
        {leaderboard.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">🏆 Top Performers</h3>
              <Link href="/leaderboard" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                View Full Leaderboard →
              </Link>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
              {leaderboard.slice((leaderboardPage - 1) * 5, leaderboardPage * 5).map((entry, index) => (
                <div 
                  key={entry.rank}
                  className={`flex items-center justify-between p-4 ${index !== 4 ? 'border-b border-gray-800' : ''} hover:bg-gray-800/50 transition-colors`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      entry.rank === 1 ? 'bg-yellow-500 text-black' :
                      entry.rank === 2 ? 'bg-gray-400 text-black' :
                      entry.rank === 3 ? 'bg-orange-600 text-white' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {entry.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-1">{entry.handle}</div>
                      {entry.country_code && (
                        <div className="flex items-center gap-2">
                          <img 
                            src={`https://flagsapi.com/${entry.country_code}/flat/32.png`}
                            alt={entry.country_code}
                            className="w-6 h-4 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="text-xs text-gray-300">{entry.country_code}</span>
                          <span className="text-xs text-gray-400">({getCountryName(entry.country_code)})</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-yellow-400">{entry.xp_points.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">XP</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {leaderboard.length > 5 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setLeaderboardPage(Math.max(1, leaderboardPage - 1))}
                  disabled={leaderboardPage === 1}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-gray-400 text-sm">
                  Page {leaderboardPage} of {Math.ceil(leaderboard.length / 5)}
                </span>
                <button
                  onClick={() => setLeaderboardPage(Math.min(Math.ceil(leaderboard.length / 5), leaderboardPage + 1))}
                  disabled={leaderboardPage >= Math.ceil(leaderboard.length / 5)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
