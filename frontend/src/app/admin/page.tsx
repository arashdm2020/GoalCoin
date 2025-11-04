'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  address: string;
  connectedAt: string;
  lastSeen: string;
  status: 'Active' | 'Dormant' | 'Inactive';
}

type Status = 'Active' | 'Dormant' | 'Inactive';

const getStatusColor = (status: Status): string => {
  switch (status) {
    case 'Active':
      return 'text-green-400';
    case 'Dormant':
      return 'text-yellow-400';
    case 'Inactive':
      return 'text-red-400';
  }
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authHeader, setAuthHeader] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // State for filtering and searching
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Status>('All');

  useEffect(() => {
    // Check if already authenticated (session stored in localStorage)
    const storedAuth = localStorage.getItem('admin_auth_header');
    if (storedAuth) {
      setIsAuthenticated(true);
      setAuthHeader(storedAuth);
      fetchUsers(storedAuth);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://localhost:3001';
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
        fetchUsers(basicAuth);
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (auth?: string) => {
    try {
      const authToUse = auth || authHeader;
      if (!authToUse) return;

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://localhost:3001';
      const response = await fetch(`${backendUrl}/api/admin/users`, {
        headers: {
          Authorization: `Basic ${authToUse}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else if (response.status === 401) {
        setIsAuthenticated(false);
        setAuthHeader('');
        localStorage.removeItem('admin_auth_header');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

      const filteredUsers = useMemo(() => {
    return users
      .filter((user) => user.address.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((user) => {
        if (statusFilter === 'All') return true;
        return user.status === statusFilter;
      });
  }, [users, searchTerm, statusFilter]);

    const statusCounts = useMemo(() => {
    const counts = { Active: 0, Dormant: 0, Inactive: 0 };
    users.forEach((user) => {
      counts[user.status]++;
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
        <div className="bg-gray-900 rounded-lg border border-[#FFD700]/20 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-2xl font-semibold">Connected Users</h2>
            <p className="text-gray-400 mt-2">
              Total: {users.length} ({statusCounts.Active} Active / {statusCounts.Dormant} Dormant / {statusCounts.Inactive} Inactive)
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search by address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
              />
              <div className="flex items-center gap-2">
                {(['All', 'Active', 'Dormant', 'Inactive'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      statusFilter === status
                        ? 'bg-[#FFD700] text-black'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Address</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Last Seen</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                      No users match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => {
                                        const color = getStatusColor(user.status);
                    return (
                      <tr
                        key={user.address}
                        className={`border-t border-gray-800 ${
                          index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'
                        }`}
                      >
                        <td className="px-6 py-4 font-mono text-sm">{user.address}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(user.lastSeen).toLocaleString()}
                        </td>
                                                <td className={`px-6 py-4 text-sm font-semibold ${color}`}>
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${color.replace('text', 'bg')}`}></span>
                            {user.status}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
