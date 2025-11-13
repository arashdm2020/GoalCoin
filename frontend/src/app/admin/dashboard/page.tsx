'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

interface DashboardStats {
  users: {
    total: number;
    active_7d: number;
  };
  xp: {
    avg_streak: number;
    avg_burn_multiplier: number;
  };
  burns: {
    total_goalcoin_burned: number;
  };
  treasury: {
    total_prize_pool: number;
    total_treasury: number;
    total_burned_usdt: number;
  };
  activity: {
    warmups: number;
    workouts: number;
    meals: number;
  };
  utility_bridge: {
    ad_views: number;
  };
}

interface AnalyticsData {
  platform: {
    dau: number;
    mau: number;
    total_users: number;
    paid_users: number;
    conversion_rate: number;
  };
  burn_treasury_timeline: {
    burnEvents: Array<{
      date: string;
      total_burned: number;
      burn_count: number;
    }>;
    treasuryEvents: Array<{
      date: string;
      total_revenue: number;
      transaction_count: number;
    }>;
  };
  top_xp_actions: Array<{
    event_name: string;
    event_count: number;
    unique_users: number;
  }>;
  country_distribution: Array<{
    country_code: string;
    user_count: number;
    percentage: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState<'burns' | 'treasury' | 'users'>('burns');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    try {
      const authHeader = localStorage.getItem('admin_auth_header');
      if (!authHeader) {
        router.push('/admin/login');
        return;
      }

      const [statsResponse, analyticsResponse] = await Promise.all([
        fetch(`${getBackendUrl()}/api/admin/dashboard-stats`, {
          headers: { 'Authorization': authHeader }
        }),
        fetch(`${getBackendUrl()}/api/analytics/dashboard`, {
          headers: { 'Authorization': authHeader }
        })
      ]);

      if (statsResponse.ok && analyticsResponse.ok) {
        const statsResult = await statsResponse.json();
        const analyticsResult = await analyticsResponse.json();
        
        if (statsResult.success) {
          setStats(statsResult.stats);
        }
        setAnalyticsData(analyticsResult);
        setLoading(false);
      } else if (statsResponse.status === 401 || analyticsResponse.status === 401) {
        localStorage.removeItem('admin_auth_header');
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds for live updates
    intervalRef.current = setInterval(fetchData, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon 
  }: { 
    title: string; 
    value: string | number; 
    change?: string;
    icon?: string;
  }) => (
    <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text mb-1">
        {value}
      </p>
      {change && (
        <p className="text-sm text-green-400">{change}</p>
      )}
    </div>
  );

  const getChartData = () => {
    if (!analyticsData?.burn_treasury_timeline) return null;

    const { burnEvents, treasuryEvents } = analyticsData.burn_treasury_timeline;
    
    // Prepare data based on active tab
    let labels: string[] = [];
    let datasets: any[] = [];

    if (activeTab === 'burns' && burnEvents.length > 0) {
      labels = burnEvents.map(event => new Date(event.date).toLocaleDateString()).reverse();
      datasets = [{
        label: 'GoalCoin Burned',
        data: burnEvents.map(event => event.total_burned).reverse(),
        borderColor: 'rgba(255, 255, 255, 0.9)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#fbbf24',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }];
    } else if (activeTab === 'treasury' && treasuryEvents.length > 0) {
      labels = treasuryEvents.map(event => new Date(event.date).toLocaleDateString()).reverse();
      datasets = [{
        label: 'Treasury Revenue (USD)',
        data: treasuryEvents.map(event => event.total_revenue).reverse(),
        borderColor: 'rgba(255, 255, 255, 0.9)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#fbbf24',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }];
    } else if (activeTab === 'users') {
      // Generate sample user growth data (you can replace with real API data)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString();
      });
      labels = last7Days;
      datasets = [{
        label: 'Daily Active Users',
        data: [120, 135, 148, 162, 155, 178, 192], // Sample data
        borderColor: 'rgba(255, 255, 255, 0.9)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#fbbf24',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }];
    }

    return { labels, datasets };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#fbbf24',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart' as const,
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-white text-glow">Admin Dashboard</h1>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-400">Live Data</span>
        </div>
      </div>

      {/* Top 8 Metric Cards - 4x2 Layout */}
      {stats && analyticsData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <MetricCard 
            title="Total Users" 
            value={stats.users.total.toLocaleString()} 
            change="+12% this week"
            icon="👥"
          />
          <MetricCard 
            title="Daily Active Users" 
            value={analyticsData.platform.dau.toLocaleString()} 
            change="+8% today"
            icon="🔥"
          />
          <MetricCard 
            title="Monthly Active Users" 
            value={analyticsData.platform.mau.toLocaleString()} 
            change="+15% this month"
            icon="📈"
          />
          <MetricCard 
            title="Conversion Rate" 
            value={`${analyticsData.platform.conversion_rate.toFixed(1)}%`} 
            change="+2.3% this week"
            icon="💎"
          />
          <MetricCard 
            title="Total Treasury" 
            value={`$${stats.treasury.total_treasury.toFixed(2)}`} 
            change="+5.2% today"
            icon="💰"
          />
          <MetricCard 
            title="GoalCoin Burned" 
            value={stats.burns.total_goalcoin_burned.toLocaleString()} 
            change="+18% this week"
            icon="🔥"
          />
          <MetricCard 
            title="Prize Pool" 
            value={`$${stats.treasury.total_prize_pool.toFixed(2)}`} 
            change="+3.1% today"
            icon="🏆"
          />
          <MetricCard 
            title="Total Activities" 
            value={(stats.activity.warmups + stats.activity.workouts + stats.activity.meals).toLocaleString()} 
            change="+22% this week"
            icon="⚡"
          />
        </div>
      )}

      {/* Main Content - 4 Sections: 2 Charts + 2 Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Chart with Tabs */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Live Analytics</h2>
            <div className="flex space-x-2">
              {(['burns', 'treasury', 'users'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80">
            {getChartData() && (
              <Line data={getChartData()!} options={chartOptions} />
            )}
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
          <h2 className="text-xl font-semibold text-white mb-6">User Growth Trend</h2>
          <div className="h-80">
            <Line 
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                  label: 'Total Users',
                  data: [100, 250, 400, 650, 850, stats?.users.total || 1000],
                  borderColor: 'rgba(255, 255, 255, 0.9)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: '#fbbf24',
                  pointBorderColor: '#ffffff',
                  pointBorderWidth: 2,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                }]
              }}
              options={chartOptions}
            />
          </div>
        </div>

        {/* Top XP Actions Table */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Top XP Actions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Action</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Count</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Users</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData?.top_xp_actions?.slice(0, 5).map((action, index) => (
                  <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-white">{action.event_name.replace('xp_', '').replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-yellow-400 font-semibold">{action.event_count}</td>
                    <td className="py-3 px-4 text-gray-300">{action.unique_users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Country Distribution Table */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Country Distribution</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Country</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Users</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData?.country_distribution?.slice(0, 5).map((country, index) => (
                  <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-white">{country.country_code}</td>
                    <td className="py-3 px-4 text-yellow-400 font-semibold">{country.user_count}</td>
                    <td className="py-3 px-4 text-gray-300">{country.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
