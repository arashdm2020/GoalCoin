'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

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
  country_code?: string;
  created_at?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    handle: '',
    email: '',
    country_code: ''
  });
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();

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
        setUser(data.user);
        setFormData({
          handle: data.user.handle || '',
          email: data.user.email || '',
          country_code: data.user.country_code || ''
        });
      } catch (error) {
        localStorage.removeItem('auth_token');
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      
      const response = await fetch(`${backendUrl}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setEditing(false);
        showToast('Profile updated successfully!', 'success');
      } else {
        showToast('Failed to update profile', 'error');
      }
    } catch (error) {
      showToast('Error updating profile', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-gray-800/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold">Profile Settings</h1>
            </div>
            <div className="flex items-center space-x-4">
              {editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 mb-8">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-3xl font-bold">
                {user.handle?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{user.handle}</h2>
                <p className="text-gray-400 mt-1">{user.tier} Member</p>
                <p className="text-sm text-gray-500 mt-2">
                  Member since {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Personal Information</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.handle}
                      onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-white bg-gray-800 px-4 py-3 rounded-lg">{user.handle}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  {editing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-white bg-gray-800 px-4 py-3 rounded-lg">{user.email || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Country</label>
                  {editing ? (
                    <select
                      value={formData.country_code}
                      onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="IT">Italy</option>
                      <option value="ES">Spain</option>
                      <option value="NL">Netherlands</option>
                      <option value="SE">Sweden</option>
                      <option value="NO">Norway</option>
                      <option value="DK">Denmark</option>
                      <option value="FI">Finland</option>
                      <option value="JP">Japan</option>
                      <option value="KR">South Korea</option>
                      <option value="SG">Singapore</option>
                      <option value="HK">Hong Kong</option>
                      <option value="AE">UAE</option>
                      <option value="BR">Brazil</option>
                      <option value="MX">Mexico</option>
                    </select>
                  ) : (
                    <p className="text-white bg-gray-800 px-4 py-3 rounded-lg">{user.country_code || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Stats */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Account Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">XP Points</span>
                  <span className="text-white font-bold">{user.xp_points.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">GC Balance</span>
                  <span className="text-green-400 font-bold">{user.goal_points.toLocaleString()} GC</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Current Streak</span>
                  <span className="text-orange-400 font-bold">{user.current_streak} days</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Longest Streak</span>
                  <span className="text-purple-400 font-bold">{user.longest_streak} days</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-400">Burn Multiplier</span>
                  <span className="text-blue-400 font-bold">{user.burn_multiplier}×</span>
                </div>
              </div>
            </div>

            {/* Wallet Information */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Wallet Information</h3>
              <div className="space-y-4">
                {user.wallet ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Connected Wallet</label>
                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="text-white font-mono text-sm">{user.wallet}</p>
                        <p className="text-green-400 text-xs mt-1">✓ Connected</p>
                      </div>
                      <button
                        onClick={() => router.push('/link-wallet')}
                        className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No wallet connected</p>
                    <button
                      onClick={() => router.push('/link-wallet')}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Connect Wallet
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Membership Information */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Membership</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="text-white font-semibold">{user.tier} Tier</p>
                    <p className="text-gray-400 text-sm">Current membership level</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">{user.burn_multiplier}× Multiplier</p>
                  </div>
                </div>
                {user.tier === 'FAN' && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-400 font-medium mb-2">Upgrade Available</p>
                    <p className="text-gray-300 text-sm mb-3">Join the 90-Day Challenge to unlock premium features</p>
                    <button
                      onClick={() => router.push('/checkout')}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors text-sm"
                    >
                      Upgrade Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
