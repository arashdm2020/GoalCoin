'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { InstallPWA } from '@/components/InstallPWA';

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

interface Notification {
  id: string;
  type: 'achievement' | 'reminder' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
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
        
        // Fetch real notifications
        fetchNotifications(token, backendUrl);
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
      const response = await fetch(`${backendUrl}/api/notifications?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
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
      {/* PWA Install Button */}
      <InstallPWA />
      
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
                    <div className="absolute right-0 mt-2 w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-[80vh] flex flex-col">
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
                              setNotifications(notifications.map(n => ({ ...n, read: true })));
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto flex-1 custom-scrollbar">
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
                                setNotifications(notifications.map(n => 
                                  n.id === notification.id ? { ...n, read: true } : n
                                ));
                              }}
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm text-white truncate">{notification.title}</h4>
                                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">{notification.message}</p>
                                  <span className="text-gray-500 text-xs mt-1 inline-block">{notification.time}</span>
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
        <div className="mb-8">
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
          <div className="mb-8 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">90-Day Challenge Active</h3>
                  <p className="text-gray-300">
                    Enrolled as <span className="text-green-400 font-semibold">{user.tier}</span> member
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Burn Multiplier</p>
                <p className="text-3xl font-bold text-green-400">{user.burn_multiplier}×</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/warmup"
              className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white group-hover:text-orange-400 transition-colors">Warm-Up</h4>
                  <p className="text-sm text-gray-400">Complete daily warm-up routines</p>
                </div>
              </div>
            </Link>

            <Link
              href="/fitness/workout"
              className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">Workout</h4>
                  <p className="text-sm text-gray-400">Log your workout session</p>
                </div>
              </div>
            </Link>

            <Link
              href="/meals"
              className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-green-500/50 hover:bg-green-500/5 transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white group-hover:text-green-400 transition-colors">Meal Plan</h4>
                  <p className="text-sm text-gray-400">Log your daily meals & track nutrition</p>
                </div>
              </div>
            </Link>

            <Link
              href="/submit"
              className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white group-hover:text-purple-400 transition-colors">Weekly Proof</h4>
                  <p className="text-sm text-gray-400">Submit your weekly progress</p>
                </div>
              </div>
            </Link>

            <Link
              href="/leaderboard"
              className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white group-hover:text-yellow-400 transition-colors">Leaderboard</h4>
                  <p className="text-sm text-gray-400">See global rankings</p>
                </div>
              </div>
            </Link>

            <Link
              href="/referrals"
              className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-pink-500/50 hover:bg-pink-500/5 transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center group-hover:bg-pink-500/30 transition-colors">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white group-hover:text-pink-400 transition-colors">Referrals</h4>
                  <p className="text-sm text-gray-400">Invite friends & win prizes</p>
                </div>
              </div>
            </Link>

            <Link
              href="/shopify-redeem"
              className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">Redeem Code</h4>
                  <p className="text-sm text-gray-400">Redeem Shopify order code</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/stats"
              className="group bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/60 hover:from-yellow-500/20 hover:to-orange-500/20 transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-400 group-hover:text-yellow-300 transition-colors">My Stats</h4>
                  <p className="text-sm text-gray-400">View your detailed statistics</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
