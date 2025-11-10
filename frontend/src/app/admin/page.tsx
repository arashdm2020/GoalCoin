'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  wallet?: string;
  email?: string;
  handle?: string;
  country_code?: string;
  tier: 'FAN' | 'FOUNDER' | 'PLAYER';
  founder_nft: boolean;
  created_at: string;
  submissions?: Submission[];
}

interface Reviewer {
  wallet: string;
  enabled: boolean;
  accuracy_7d: number;
  total_votes: number;
  wrong_votes: number;
  suspended_until?: string;
}

interface Submission {
  id: string;
  user_id: string;
  challenge_id: string;
  week_no: number;
  file_url: string;
  watermark_code: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPEAL';
  created_at: string;
  closed_at?: string;
}

interface Commission {
  id: string;
  reviewer_wallet: string;
  submission_id: string;
  amount_usdt: number;
  earned_at: string;
  payout_id?: string;
}

interface LeaderboardEntry {
  wallet: string;
  handle?: string;
  country_code?: string;
  tier: string;
  total_submissions: number;
  approved_submissions: number;
  success_rate: number;
  joined_at: string;
}

type TabType = 'users' | 'reviewers' | 'submissions' | 'commissions' | 'leaderboard' | 'settings';

const getTierColor = (tier: string): string => {
  switch (tier) {
    case 'FOUNDER':
      return 'text-purple-400';
    case 'PLAYER':
      return 'text-blue-400';
    case 'FAN':
    default:
      return 'text-gray-400';
  }
};

const getSubmissionStatusColor = (status: string): string => {
  switch (status) {
    case 'APPROVED':
      return 'text-green-400';
    case 'REJECTED':
      return 'text-red-400';
    case 'APPEAL':
      return 'text-orange-400';
    case 'PENDING':
    default:
      return 'text-yellow-400';
  }
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authHeader, setAuthHeader] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  
  // Settings form states
  const [countdownDate, setCountdownDate] = useState('');
  const [countdownTitle, setCountdownTitle] = useState('');
  const [countdownEnabled, setCountdownEnabled] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'All' | 'FAN' | 'FOUNDER' | 'PLAYER'>('All');
  const [countryFilter, setCountryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPEAL'>('All');
  const [leaderboardScope, setLeaderboardScope] = useState<'global' | 'country'>('global');

  // Commission states
  const [commissionPeriod, setCommissionPeriod] = useState('');
  const [commissionPreview, setCommissionPreview] = useState<any>(null);

  useEffect(() => {
    // Check if already authenticated (session stored in localStorage)
    const storedAuth = localStorage.getItem('admin_auth_header');
    if (storedAuth) {
      // Ensure it has "Basic " prefix
      const authHeaderValue = storedAuth.startsWith('Basic ') ? storedAuth : `Basic ${storedAuth}`;
      setIsAuthenticated(true);
      setAuthHeader(authHeaderValue);
      fetchAllData(authHeaderValue);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && authHeader) {
      fetchAllData();
    }
  }, [activeTab]);

  const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const backendUrl = getBackendUrl();
      const basicAuth = btoa(`${username}:${password}`);
      
      const response = await fetch(`${backendUrl}/api/admin/users`, {
        headers: {
          Authorization: `Basic ${basicAuth}`,
        },
      });

      if (response.ok) {
        setIsAuthenticated(true);
        const fullAuthHeader = `Basic ${basicAuth}`;
        setAuthHeader(fullAuthHeader);
        localStorage.setItem('admin_auth_header', fullAuthHeader);
        fetchAllData(fullAuthHeader);
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async (auth?: string) => {
    const authToUse = auth || authHeader;
    if (!authToUse) return;

    switch (activeTab) {
      case 'users':
        await fetchUsers(authToUse);
        break;
      case 'reviewers':
        await fetchReviewers(authToUse);
        break;
      case 'submissions':
        await fetchSubmissions(authToUse);
        break;
      case 'commissions':
        await fetchCommissions(authToUse);
        break;
      case 'leaderboard':
        await fetchLeaderboard(authToUse);
        break;
      case 'settings':
        await fetchSettings(authToUse);
        break;
    }
  };

  const fetchUsers = async (auth?: string) => {
    try {
      const authToUse = auth || authHeader;
      if (!authToUse) return;

      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/users`, {
        headers: {
          Authorization: authToUse,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else if (response.status === 401) {
        handleAuthError();
      } else {
        setError(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to connect to backend server. Make sure the backend is running on localhost:3001');
    }
  };

  const fetchReviewers = async (auth?: string) => {
    try {
      const authToUse = auth || authHeader;
      if (!authToUse) return;

      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/reviewers`, {
        headers: {
          Authorization: authToUse,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviewers(data.reviewers || []);
      } else if (response.status === 401) {
        handleAuthError();
      }
    } catch (err) {
      console.error('Error fetching reviewers:', err);
    }
  };

  const fetchSubmissions = async (auth?: string) => {
    try {
      const authToUse = auth || authHeader;
      if (!authToUse) return;

      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/submissions`, {
        headers: {
          Authorization: authToUse,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      } else if (response.status === 401) {
        handleAuthError();
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  const fetchCommissions = async (auth?: string) => {
    try {
      const authToUse = auth || authHeader;
      if (!authToUse) return;

      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/commissions/preview${commissionPeriod ? `?period=${commissionPeriod}` : ''}`, {
        headers: {
          Authorization: authToUse,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCommissions(data.commissions || []);
        setCommissionPreview(data);
      } else if (response.status === 401) {
        handleAuthError();
      }
    } catch (err) {
      console.error('Error fetching commissions:', err);
    }
  };

  const fetchLeaderboard = async (auth?: string) => {
    try {
      const authToUse = auth || authHeader;
      if (!authToUse) return;

      const backendUrl = getBackendUrl();
      const url = `${backendUrl}/api/leaderboard?scope=${leaderboardScope}${leaderboardScope === 'country' && countryFilter ? `&country=${countryFilter}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: authToUse,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } else if (response.status === 401) {
        handleAuthError();
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  const fetchSettings = async (auth?: string) => {
    try {
      const authToUse = auth || authHeader;
      if (!authToUse) return;

      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/settings/admin/all`, {
        headers: {
          Authorization: authToUse,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || []);
        
        // Set form values from settings
        const countdownDateSetting = data.settings.find((s: any) => s.key === 'countdown_target_date');
        const countdownTitleSetting = data.settings.find((s: any) => s.key === 'countdown_title');
        const countdownEnabledSetting = data.settings.find((s: any) => s.key === 'countdown_enabled');
        
        if (countdownDateSetting) setCountdownDate(countdownDateSetting.value);
        if (countdownTitleSetting) setCountdownTitle(countdownTitleSetting.value);
        if (countdownEnabledSetting) setCountdownEnabled(countdownEnabledSetting.value === 'true');
      } else if (response.status === 401) {
        handleAuthError();
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleAuthError = () => {
    setIsAuthenticated(false);
    setAuthHeader('');
    localStorage.removeItem('admin_auth_header');
  };

  // Action functions
  const suspendReviewer = async (wallet: string, days: number = 7) => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/reviewers/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ wallet, days }),
      });

      if (response.ok) {
        await fetchReviewers();
      } else {
        setError('Failed to suspend reviewer');
      }
    } catch (err) {
      setError('Failed to suspend reviewer');
    }
  };

  const toggleReviewerStatus = async (wallet: string) => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/reviewers/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ wallet }),
      });

      if (response.ok) {
        await fetchReviewers();
      } else {
        setError('Failed to toggle reviewer status');
      }
    } catch (err) {
      setError('Failed to toggle reviewer status');
    }
  };

  const closeSubmission = async (submissionId: string) => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/submissions/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ submission_id: submissionId }),
      });

      if (response.ok) {
        await fetchSubmissions();
      } else {
        setError('Failed to close submission');
      }
    } catch (err) {
      setError('Failed to close submission');
    }
  };

  const markCommissionsPaid = async (txHash: string) => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/commissions/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ 
          period: commissionPeriod,
          tx_hash: txHash 
        }),
      });

      if (response.ok) {
        await fetchCommissions();
      } else {
        setError('Failed to mark commissions as paid');
      }
    } catch (err) {
      setError('Failed to mark commissions as paid');
    }
  };

  const updateCountdownSettings = async () => {
    try {
      setLoading(true);
      const backendUrl = getBackendUrl();
      
      await Promise.all([
        fetch(`${backendUrl}/api/settings/admin/countdown_target_date`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({ value: countdownDate }),
        }),
        fetch(`${backendUrl}/api/settings/admin/countdown_title`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({ value: countdownTitle }),
        }),
        fetch(`${backendUrl}/api/settings/admin/countdown_enabled`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({ value: countdownEnabled.toString() }),
        }),
      ]);

      setError('');
      alert('Settings updated successfully!');
      await fetchSettings();
    } catch (err) {
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  // Filtering logic
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => 
        (user.wallet && user.wallet.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.handle && user.handle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .filter((user) => {
        if (tierFilter === 'All') return true;
        return user.tier === tierFilter;
      })
      .filter((user) => {
        if (!countryFilter) return true;
        return user.country_code === countryFilter;
      });
  }, [users, searchTerm, tierFilter, countryFilter]);

  const filteredReviewers = useMemo(() => {
    return reviewers
      .filter((reviewer) => 
        reviewer.wallet.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [reviewers, searchTerm]);

  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((submission) => 
        submission.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.user_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((submission) => {
        if (statusFilter === 'All') return true;
        return submission.status === statusFilter;
      });
  }, [submissions, searchTerm, statusFilter]);

  const tierCounts = useMemo(() => {
    const counts = { FAN: 0, FOUNDER: 0, PLAYER: 0 };
    users.forEach((user) => {
      counts[user.tier]++;
    });
    return counts;
  }, [users]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.clear(); // Clear all localStorage to avoid auth issues
    setUsername('');
    setPassword('');
    setAuthHeader('');
    setUsers([]);
    setReviewers([]);
    setSubmissions([]);
    setCommissions([]);
    setLeaderboard([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-[#FFD700] flex items-center justify-center">
        <div className="bg-gray-900 rounded-lg p-8 border border-[#FFD700]/20 w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-2 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <button
            onClick={() => router.push('/')}
            className="mt-4 w-full text-center text-gray-400 hover:text-[#FFD700] transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#FFD700]">
      <header className="container mx-auto px-6 py-6 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/admin/analytics')}
            className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            📊 Analytics
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-800">
            <nav className="flex space-x-8">
              {(['users', 'reviewers', 'submissions', 'commissions', 'leaderboard', 'settings'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-[#FFD700] text-[#FFD700]'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-gray-900 rounded-lg border border-[#FFD700]/20 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-semibold">Users Management</h2>
              <p className="text-gray-400 mt-2">
                Total: {users.length} ({tierCounts.FAN} Fans / {tierCounts.FOUNDER} Founders / {tierCounts.PLAYER} Players)
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search by wallet, handle, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-grow px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                />
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value as any)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                >
                  <option value="All">All Tiers</option>
                  <option value="FAN">Fan</option>
                  <option value="FOUNDER">Founder</option>
                  <option value="PLAYER">Player</option>
                </select>
                <input
                  type="text"
                  placeholder="Country code..."
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Wallet</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Handle</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Country</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Tier</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">NFT</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                        No users match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className={`border-t border-gray-800 ${
                          index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'
                        }`}
                      >
                        <td className="px-6 py-4 font-mono text-sm">{user.wallet ? user.wallet.slice(0, 10) + '...' : '-'}</td>
                        <td className="px-6 py-4 text-sm">{user.handle || '-'}</td>
                        <td className="px-6 py-4 text-sm">{user.email || '-'}</td>
                        <td className="px-6 py-4 text-sm">{user.country_code || '-'}</td>
                        <td className={`px-6 py-4 text-sm font-semibold ${getTierColor(user.tier)}`}>
                          {user.tier}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {user.founder_nft ? (
                            <span className="text-purple-400">✓</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Clear All Users Button (MVP Only) */}
            <div className="p-6 border-t border-gray-800 bg-red-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-red-400">⚠️ Danger Zone (MVP Only)</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Clear all users and related data for testing purposes
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm('⚠️ WARNING!\n\nThis will permanently delete ALL users and their data!\n\nAre you absolutely sure?')) {
                      return;
                    }
                    if (!confirm('This action CANNOT be undone!\n\nType YES in the next prompt to confirm.')) {
                      return;
                    }
                    const confirmation = prompt('Type "DELETE ALL USERS" to confirm:');
                    if (confirmation !== 'DELETE ALL USERS') {
                      alert('Cancelled. No data was deleted.');
                      return;
                    }

                    try {
                      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
                      const response = await fetch(`${backendUrl}/api/admin/users/clear-all`, {
                        method: 'DELETE',
                        headers: {
                          'Authorization': authHeader,
                          'Content-Type': 'application/json',
                        },
                      });

                      if (response.ok) {
                        alert('✅ All users cleared successfully!');
                        setUsers([]);
                      } else {
                        throw new Error('Failed to clear users');
                      }
                    } catch (err) {
                      alert('❌ Error: ' + (err as Error).message);
                    }
                  }}
                  className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  🗑️ Clear All Users
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reviewers Tab */}
        {activeTab === 'reviewers' && (
          <div className="bg-gray-900 rounded-lg border border-[#FFD700]/20 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-semibold">Reviewer Management</h2>
              <p className="text-gray-400 mt-2">
                Total: {reviewers.length} reviewers
              </p>
              <div className="mt-6">
                <input
                  type="text"
                  placeholder="Search by wallet address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Wallet</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Accuracy (7d)</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Total Votes</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Wrong Votes</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Suspended Until</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviewers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                        No reviewers found.
                      </td>
                    </tr>
                  ) : (
                    filteredReviewers.map((reviewer, index) => (
                      <tr
                        key={reviewer.wallet}
                        className={`border-t border-gray-800 ${
                          index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'
                        }`}
                      >
                        <td className="px-6 py-4 font-mono text-sm">{reviewer.wallet.slice(0, 10)}...</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            reviewer.enabled ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
                          }`}>
                            {reviewer.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`font-medium ${
                            reviewer.accuracy_7d >= 85 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {reviewer.accuracy_7d.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{reviewer.total_votes}</td>
                        <td className="px-6 py-4 text-sm">{reviewer.wrong_votes}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {reviewer.suspended_until ? new Date(reviewer.suspended_until).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleReviewerStatus(reviewer.wallet)}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                reviewer.enabled
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              {reviewer.enabled ? 'Disable' : 'Enable'}
                            </button>
                            {reviewer.enabled && (
                              <button
                                onClick={() => suspendReviewer(reviewer.wallet)}
                                className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-medium"
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <div className="bg-gray-900 rounded-lg border border-[#FFD700]/20 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-semibold">Submission Management</h2>
              <p className="text-gray-400 mt-2">
                Total: {submissions.length} submissions
              </p>
              <div className="mt-6 flex gap-4">
                <input
                  type="text"
                  placeholder="Search by submission ID or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'All' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPEAL')}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                >
                  <option value="All">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="APPEAL">Appeal</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Challenge</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Week</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Watermark</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Submitted</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                        No submissions match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((submission, index) => (
                      <tr
                        key={submission.id}
                        className={`border-t border-gray-800 ${
                          index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'
                        }`}
                      >
                        <td className="px-6 py-4 font-mono text-xs">{submission.id.slice(0, 8)}...</td>
                        <td className="px-6 py-4 font-mono text-xs">{submission.user_id.slice(0, 8)}...</td>
                        <td className="px-6 py-4 font-mono text-xs">{submission.challenge_id.slice(0, 8)}...</td>
                        <td className="px-6 py-4 text-sm">{submission.week_no}</td>
                        <td className={`px-6 py-4 text-sm font-semibold ${getSubmissionStatusColor(submission.status)}`}>
                          {submission.status}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{submission.watermark_code}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <a
                            href={submission.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FFD700] hover:underline"
                          >
                            View File
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Commissions Tab */}
        {activeTab === 'commissions' && (
          <div className="bg-gray-900 rounded-lg border border-[#FFD700]/20 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-semibold">Commission Management</h2>
              <p className="text-gray-400 mt-2">
                Total: {commissions.length} commissions | 
                Unpaid: {commissions.filter(c => !c.payout_id).length}
              </p>
              <div className="mt-6">
                <input
                  type="text"
                  placeholder="Search by reviewer wallet or submission ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Reviewer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Submission</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Amount (USDT)</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Earned At</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Payout ID</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                        No commissions found.
                      </td>
                    </tr>
                  ) : (
                    commissions.map((commission, index) => (
                      <tr
                        key={commission.id}
                        className={`border-t border-gray-800 ${
                          index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'
                        }`}
                      >
                        <td className="px-6 py-4 font-mono text-xs">{commission.id.slice(0, 8)}...</td>
                        <td className="px-6 py-4 font-mono text-sm">{commission.reviewer_wallet.slice(0, 10)}...</td>
                        <td className="px-6 py-4 font-mono text-xs">{commission.submission_id.slice(0, 8)}...</td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-400">
                          ${commission.amount_usdt.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(commission.earned_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            commission.payout_id ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'
                          }`}>
                            {commission.payout_id ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-400">
                          {commission.payout_id ? commission.payout_id.slice(0, 8) + '...' : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="bg-gray-900 rounded-lg border border-[#FFD700]/20 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-semibold">Leaderboard</h2>
              <p className="text-gray-400 mt-2">
                Total: {leaderboard.length} participants
              </p>
              <div className="mt-6">
                <input
                  type="text"
                  placeholder="Search by wallet or handle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Rank</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Wallet</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Handle</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Country</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Tier</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Total Submissions</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Approved</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Success Rate</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-400">
                        No leaderboard data available.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((entry, index) => (
                      <tr
                        key={entry.wallet}
                        className={`border-t border-gray-800 ${
                          index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-bold">
                          <span className={`${
                            index === 0 ? 'text-yellow-400' : 
                            index === 1 ? 'text-gray-300' : 
                            index === 2 ? 'text-orange-400' : 
                            'text-gray-400'
                          }`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm">{entry.wallet.slice(0, 10)}...</td>
                        <td className="px-6 py-4 text-sm">{entry.handle || '-'}</td>
                        <td className="px-6 py-4 text-sm">{entry.country_code || '-'}</td>
                        <td className={`px-6 py-4 text-sm font-semibold ${getTierColor(entry.tier)}`}>
                          {entry.tier}
                        </td>
                        <td className="px-6 py-4 text-sm">{entry.total_submissions}</td>
                        <td className="px-6 py-4 text-sm text-green-400">{entry.approved_submissions}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`font-medium ${
                            entry.success_rate >= 80 ? 'text-green-400' : 
                            entry.success_rate >= 50 ? 'text-yellow-400' : 
                            'text-red-400'
                          }`}>
                            {entry.success_rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(entry.joined_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-gray-900 rounded-lg border border-[#FFD700]/20 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-semibold">App Settings</h2>
              <p className="text-gray-400 mt-2">
                Configure homepage countdown timer and other settings
              </p>
            </div>

            <div className="p-6">
              {/* Countdown Timer Settings */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Homepage Countdown Timer</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Countdown Title
                    </label>
                    <input
                      type="text"
                      value={countdownTitle}
                      onChange={(e) => setCountdownTitle(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                      placeholder="Launch Countdown"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Target Date & Time
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={countdownDate ? new Date(countdownDate).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setCountdownDate(new Date(e.target.value).toISOString())}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700] focus:ring-2 focus:ring-[#FFD700]/20 transition-all"
                        style={{
                          colorScheme: 'dark',
                        }}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-300">
                          Current: <span className="text-[#FFD700] font-semibold">
                            {countdownDate ? new Date(countdownDate).toLocaleString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Not set'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="countdown-enabled"
                      checked={countdownEnabled}
                      onChange={(e) => setCountdownEnabled(e.target.checked)}
                      className="w-5 h-5 text-[#FFD700] bg-gray-800 border-gray-700 rounded focus:ring-[#FFD700]"
                    />
                    <label htmlFor="countdown-enabled" className="text-sm font-medium">
                      Enable countdown timer on homepage
                    </label>
                  </div>

                  <button
                    onClick={updateCountdownSettings}
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>

              {/* All Settings Table */}
              <div>
                <h3 className="text-xl font-semibold mb-4">All Settings</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Key
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Updated At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-800">
                      {settings.map((setting) => (
                        <tr key={setting.key}>
                          <td className="px-6 py-4 text-sm font-mono text-[#FFD700]">
                            {setting.key}
                          </td>
                          <td className="px-6 py-4 text-sm text-white">
                            {setting.value}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {setting.description || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {setting.updated_at ? new Date(setting.updated_at).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
