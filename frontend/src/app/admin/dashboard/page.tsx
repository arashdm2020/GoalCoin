'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard-stats');
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white text-glow mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-gray-400 text-sm">Total Users</h3>
          <p className="text-2xl font-bold">{stats?.totalUsers ?? 'Loading...'}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-gray-400 text-sm">Pending Submissions</h3>
          <p className="text-2xl font-bold">{stats?.pendingSubmissions ?? 'Loading...'}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-gray-400 text-sm">Active Reviewers</h3>
          <p className="text-2xl font-bold">{stats?.activeReviewers ?? 'Loading...'}</p>
        </div>
      </div>
    </div>
  );
}
