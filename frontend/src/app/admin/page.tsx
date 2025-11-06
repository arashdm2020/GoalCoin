'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  wallet: string;
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

type TabType = 'users' | 'reviewers' | 'submissions' | 'commissions' | 'leaderboard';

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
      setIsAuthenticated(true);
      setAuthHeader(storedAuth);
      fetchAllData(storedAuth);
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
        setAuthHeader(basicAuth);
        localStorage.setItem('admin_auth_header', basicAuth);
        fetchAllData(basicAuth);
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
    }
  };

  const fetchUsers = async (auth?: string) => {
    try {
      const authToUse = auth || authHeader;
      if (!authToUse) return;

      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/users`, {
        headers: {
          Authorization: `Basic ${authToUse}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else if (response.status === 401) {
        handleAuthError();
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchReviewers = async (auth?: string) => {
    try {
      const authToUse = auth || authHeader;
      if (!authToUse) return;

      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/admin/reviewers`, {
        headers: {
          Authorization: `Basic ${authToUse}`,
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
          Authorization: `Basic ${authToUse}`,
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
          Authorization: `Basic ${authToUse}`,
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
          Authorization: `Basic ${authToUse}`,
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
          Authorization: `Basic ${authHeader}`,
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
          Authorization: `Basic ${authHeader}`,
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
          Authorization: `Basic ${authHeader}`,
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
          Authorization: `Basic ${authHeader}`,
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

  // Filtering logic
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => 
        user.wallet.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    localStorage.removeItem('admin_auth_header');
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
        <button
          onClick={handleLogout}
          className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Logout
        </button>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-800">
            <nav className="flex space-x-8">
              {(['users', 'reviewers', 'submissions', 'commissions', 'leaderboard'] as TabType[]).map((tab) => (
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
                        <td className="px-6 py-4 font-mono text-sm">{user.wallet.slice(0, 10)}...</td>
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
      </main>
    </div>
  );
}
