'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCountryName } from '@/utils/countries';

interface User {
  id: string;
  handle: string;
  email: string;
  tier: string;
  payment_tier?: string;
  xp_points: number;
  goal_points: number;
  current_streak: number;
  country_code: string;
  created_at: string;
}

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) {
        router.push('/admin/login');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '25',
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`${getBackendUrl()}/api/admin/users?${params}`, {
        headers: { Authorization: authHeader },
      });

      if (response.status === 401) {
        localStorage.removeItem('admin_auth_header');
        router.push('/admin/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-300">View and manage all users</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by handle or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/20">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">User</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Tier</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">XP</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">GC</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Streak</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Country</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Joined</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((user) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => handleUserClick(user.id)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{user.handle || 'N/A'}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 w-fit">
                            {user.tier}
                          </span>
                          {user.payment_tier && (
                            <span className="text-xs text-green-400">${user.payment_tier}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-yellow-400 font-medium">{user.xp_points.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-green-400 font-medium">{user.goal_points.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-orange-400 font-medium">🔥 {user.current_streak}</span>
                      </td>
                      <td className="px-6 py-4">
                        {user.country_code ? (
                          <div className="flex items-center gap-2">
                            <img 
                              src={`https://flagsapi.com/${user.country_code}/flat/32.png`}
                              alt={user.country_code}
                              className="w-6 h-4 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <span className="text-sm text-gray-300">{user.country_code}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUserClick(user.id);
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/20 bg-white/5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
