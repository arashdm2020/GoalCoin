'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AnalyticsDashboard {
  platform: {
    dau: number;
    mau: number;
    total_users: number;
    paid_users: number;
    conversion_rate: number;
  };
  funnel: {
    signups: number;
    wallet_connected: number;
    first_xp: number;
    tier_1: number;
    conversion_rates: {
      signup_to_wallet: number;
      wallet_to_xp: number;
      xp_to_tier1: number;
      overall: number;
    };
  };
  retention: {
    d1: { cohort: number; retained: number; rate: number };
    d7: { cohort: number; retained: number; rate: number };
    d30: { cohort: number; retained: number; rate: number };
  };
  xp_per_dau: {
    active_users: number;
    total_xp: number;
    avg_xp_per_user: number;
  };
  country_distribution: Array<{
    country_code: string;
    user_count: number;
    percentage: number;
  }>;
  top_xp_actions: Array<{
    event_name: string;
    event_count: number;
    unique_users: number;
  }>;
  generated_at: string;
}

export default function AnalyticsDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const authHeader = localStorage.getItem('admin_auth_header');
    if (!authHeader) {
      router.push('/admin');
      return;
    }
    setIsAuthenticated(true);
    fetchDashboard(authHeader);
  }, []);

  const fetchDashboard = async (authHeader: string) => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const response = await fetch(`${backendUrl}/api/analytics/dashboard`, {
        headers: { Authorization: authHeader },
      });

      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      } else if (response.status === 401) {
        router.push('/admin');
      } else {
        setError('Failed to load analytics');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error || 'No data available'}</p>
          <button
            onClick={() => router.push('/admin')}
            className="mt-4 px-6 py-2 bg-yellow-500 text-black rounded-lg"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-yellow-500">📊 Analytics Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">
              Last updated: {new Date(data.generated_at).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            ← Back to Admin
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Platform Metrics */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-yellow-500">Platform Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              title="DAU"
              value={data.platform.dau}
              subtitle="Daily Active Users"
              icon="👥"
            />
            <MetricCard
              title="MAU"
              value={data.platform.mau}
              subtitle="Monthly Active Users"
              icon="📅"
            />
            <MetricCard
              title="Total Users"
              value={data.platform.total_users}
              subtitle="All registered"
              icon="🌍"
            />
            <MetricCard
              title="Paid Users"
              value={data.platform.paid_users}
              subtitle={`${data.platform.conversion_rate.toFixed(1)}% conversion`}
              icon="💰"
            />
            <MetricCard
              title="XP/DAU"
              value={Math.round(data.xp_per_dau.avg_xp_per_user)}
              subtitle="Avg XP per active user"
              icon="⚡"
            />
          </div>
        </section>

        {/* Signup Funnel */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-yellow-500">Signup Funnel (Last 30 Days)</h2>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="space-y-4">
              <FunnelStep
                label="Signups"
                value={data.funnel.signups}
                percentage={100}
                isFirst
              />
              <FunnelStep
                label="Wallet Connected"
                value={data.funnel.wallet_connected}
                percentage={data.funnel.conversion_rates.signup_to_wallet}
              />
              <FunnelStep
                label="First XP Earned"
                value={data.funnel.first_xp}
                percentage={data.funnel.conversion_rates.wallet_to_xp}
              />
              <FunnelStep
                label="Tier 1 (Paid)"
                value={data.funnel.tier_1}
                percentage={data.funnel.conversion_rates.xp_to_tier1}
                isLast
              />
            </div>
            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-center text-lg">
                <span className="text-gray-400">Overall Conversion: </span>
                <span className="text-yellow-500 font-bold">
                  {data.funnel.conversion_rates.overall.toFixed(2)}%
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Retention Metrics */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-yellow-500">Retention Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RetentionCard
              title="D1 Retention"
              cohort={data.retention.d1.cohort}
              retained={data.retention.d1.retained}
              rate={data.retention.d1.rate}
            />
            <RetentionCard
              title="D7 Retention"
              cohort={data.retention.d7.cohort}
              retained={data.retention.d7.retained}
              rate={data.retention.d7.rate}
            />
            <RetentionCard
              title="D30 Retention"
              cohort={data.retention.d30.cohort}
              retained={data.retention.d30.retained}
              rate={data.retention.d30.rate}
            />
          </div>
        </section>

        {/* Country Distribution */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-yellow-500">Top Countries</h2>
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Country</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Users</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Percentage</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Bar</th>
                </tr>
              </thead>
              <tbody>
                {data.country_distribution.slice(0, 10).map((country, index) => (
                  <tr key={country.country_code} className="border-t border-gray-800">
                    <td className="px-6 py-3 font-semibold">{country.country_code}</td>
                    <td className="px-6 py-3">{country.user_count}</td>
                    <td className="px-6 py-3">{country.percentage}%</td>
                    <td className="px-6 py-3">
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${country.percentage}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top XP Actions */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-yellow-500">Top XP Actions (Last 7 Days)</h2>
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Count</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Unique Users</th>
                </tr>
              </thead>
              <tbody>
                {data.top_xp_actions.map((action, index) => (
                  <tr key={index} className="border-t border-gray-800">
                    <td className="px-6 py-3 font-mono text-sm">{action.event_name}</td>
                    <td className="px-6 py-3">{action.event_count}</td>
                    <td className="px-6 py-3">{action.unique_users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon }: any) {
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function FunnelStep({ label, value, percentage, isFirst = false, isLast = false }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm text-gray-400">{value} users</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${
              isFirst ? 'bg-green-500' : isLast ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
      <div className="text-right min-w-[60px]">
        <span className="text-lg font-bold">{percentage.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function RetentionCard({ title, cohort, retained, rate }: any) {
  const getColor = (rate: number) => {
    if (rate >= 40) return 'text-green-500';
    if (rate >= 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h3 className="text-sm font-medium text-gray-400 mb-4">{title}</h3>
      <div className="text-center mb-4">
        <p className={`text-4xl font-bold ${getColor(rate)}`}>{rate.toFixed(1)}%</p>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Cohort:</span>
          <span className="font-medium">{cohort}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Retained:</span>
          <span className="font-medium">{retained}</span>
        </div>
      </div>
    </div>
  );
}
