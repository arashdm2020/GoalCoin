'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // IMPORTANT: We need to get the auth header from somewhere (e.g., localStorage)
        const authHeader = localStorage.getItem('admin_auth_header'); 
        if (!authHeader) return; // Or handle redirect to login

        const url = `${getBackendUrl()}/api/admin/dashboard-stats`;
        const response = await fetch(url, {
          headers: { 'Authorization': authHeader }
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setStats(result.data);
          }
        } else if (response.status === 401) {
          localStorage.removeItem('admin_auth_header');
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value }: { title: string; value: string | number }) => (
    <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
      <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-white text-glow mb-8">Dashboard</h1>
      {stats ? (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-glow">Users & Engagement</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard title="Total Users" value={stats.users.total} />
              <StatCard title="Active Users (7d)" value={stats.users.active_7d} />
              <StatCard title="Avg. Streak" value={stats.xp.avg_streak.toFixed(2)} />
              <StatCard title="Avg. Burn Multiplier" value={stats.xp.avg_burn_multiplier.toFixed(2)} />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4 text-glow">Economy & Treasury</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard title="Total GoalCoin Burned" value={stats.burns.total_goalcoin_burned.toLocaleString()} />
              <StatCard title="Total Prize Pool (USDT)" value={`$${stats.treasury.total_prize_pool.toFixed(2)}`} />
              <StatCard title="Total Treasury (USDT)" value={`$${stats.treasury.total_treasury.toFixed(2)}`} />
              <StatCard title="Total Burned (USDT)" value={`$${stats.treasury.total_burned_usdt.toFixed(2)}`} />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4 text-glow">Platform Activity</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard title="Warmups" value={stats.activity.warmups.toLocaleString()} />
              <StatCard title="Workouts" value={stats.activity.workouts.toLocaleString()} />
              <StatCard title="Meals" value={stats.activity.meals.toLocaleString()} />
              <StatCard title="Ad Views" value={stats.utility_bridge.ad_views.toLocaleString()} />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Loading dashboard stats...</p>
      )}
    </div>
  );

}
