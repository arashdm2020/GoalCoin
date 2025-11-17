'use client';

import { useState, useEffect } from 'react';
import Pagination from '@/components/admin/Pagination';
import LoadingSkeleton from '@/components/LoadingSkeleton';

interface Membership {
  id: string;
  user_id: string;
  username: string;
  email: string;
  wallet_address: string | null;
  tier: 'BASIC' | 'PREMIUM' | 'VIP';
  tier_price: number;
  payment_method: 'COINPAYMENTS' | 'STRIPE' | 'MANUAL';
  payment_status: 'PAID' | 'PENDING' | 'FAILED';
  transaction_id: string | null;
  amount_paid: number;
  country: string | null;
  joined_at: string;
}

interface Stats {
  total_members: number;
  total_revenue: number;
  paid_count: number;
  pending_count: number;
  failed_count: number;
}

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getBackendUrl = () => {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';
  };

  useEffect(() => {
    fetchMemberships();
    fetchStats();
  }, [currentPage, filterTier, filterStatus, filterCountry, searchTerm]);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return;

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '25',
        ...(filterTier !== 'all' && { tier: filterTier }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterCountry !== 'all' && { country: filterCountry }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`${getBackendUrl()}/api/admin/memberships?${params}`, {
        headers: { Authorization: authHeader },
      });

      if (response.ok) {
        const data = await response.json();
        setMemberships(data.memberships || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return;

      const response = await fetch(`${getBackendUrl()}/api/admin/memberships/stats`, {
        headers: { Authorization: authHeader },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const exportToCSV = async () => {
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) return;

      const params = new URLSearchParams({
        ...(filterTier !== 'all' && { tier: filterTier }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterCountry !== 'all' && { country: filterCountry }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`${getBackendUrl()}/api/admin/memberships/export?${params}`, {
        headers: { Authorization: authHeader },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memberships_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'BASIC': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'PREMIUM': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'VIP': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'FAILED': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Membership & Payments</h1>
        <p className="text-gray-400">Manage challenge entries and track payments</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">👥</span>
              <span className="text-sm text-gray-400">Total Members</span>
            </div>
            <p className="text-2xl font-bold">{stats.total_members}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💰</span>
              <span className="text-sm text-gray-400">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold">${stats.total_revenue.toFixed(2)}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-400">Paid</span>
            </div>
            <p className="text-2xl font-bold">{stats.paid_count}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-gray-400">Pending</span>
            </div>
            <p className="text-2xl font-bold">{stats.pending_count}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-400">Failed</span>
            </div>
            <p className="text-2xl font-bold">{stats.failed_count}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search username, email, wallet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Tier Filter */}
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Tiers</option>
            <option value="BASIC">Basic ($19)</option>
            <option value="PREMIUM">Premium ($35)</option>
            <option value="VIP">VIP ($49)</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Country Filter */}
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Countries</option>
            {/* Will be populated dynamically */}
          </select>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <span>📥</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4">
            <LoadingSkeleton type="table" rows={10} />
          </div>
        ) : memberships.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No memberships found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0a] border-b border-gray-800">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Wallet</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Tier</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Amount</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Method</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Transaction ID</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Country</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {memberships.map((membership) => (
                  <tr key={membership.id} className="hover:bg-[#0a0a0a] transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{membership.username}</p>
                        <p className="text-sm text-gray-400">{membership.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {membership.wallet_address ? (
                        <code className="text-xs bg-[#0a0a0a] px-2 py-1 rounded">
                          {membership.wallet_address.slice(0, 6)}...{membership.wallet_address.slice(-4)}
                        </code>
                      ) : (
                        <span className="text-gray-500 text-sm">No wallet</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTierBadgeColor(membership.tier)}`}>
                        {membership.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">${membership.amount_paid.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(membership.payment_status)}`}>
                        {membership.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{membership.payment_method}</td>
                    <td className="px-4 py-3">
                      {membership.transaction_id ? (
                        <code className="text-xs bg-[#0a0a0a] px-2 py-1 rounded">
                          {membership.transaction_id.slice(0, 8)}...
                        </code>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{membership.country || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(membership.joined_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
