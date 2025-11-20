'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/admin/Pagination';

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
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
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
        limit: itemsPerPage.toString(),
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
        setTotalItems(data.total || 0);
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      {/* Search Bar */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search username, email, wallet..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden mb-6">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0a] border-b border-gray-800">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Tier</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">XP</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">GC</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Streak</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Country</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Joined</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#0a0a0a] transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{user.handle || 'N/A'}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                        {user.tier}
                      </span>
                      {user.payment_tier && (
                        <div className="text-xs text-green-400 mt-1">${user.payment_tier}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-yellow-400">{user.xp_points.toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-green-400">{user.goal_points.toLocaleString()}</td>
                    <td className="px-4 py-3 text-orange-400">🔥 {user.current_streak}</td>
                    <td className="px-4 py-3">
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
                          <span className="text-sm">{user.country_code}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleUserClick(user.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
}
