'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface XPLog {
  id: string;
  action_type: string;
  xp_earned: number;
  description: string;
  created_at: string;
  metadata?: any;
}

export default function XPLogsPage() {
  const [logs, setLogs] = useState<XPLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalXP, setTotalXP] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchXPLogs();
  }, []);

  const fetchXPLogs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://goalcoin.onrender.com';
      
      // Fetch XP logs
      const response = await fetch(`${backendUrl}/api/xp/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotalXP(data.total_xp || 0);
      }
    } catch (error) {
      console.error('Error fetching XP logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'workout':
        return '💪';
      case 'warmup':
        return '🔥';
      case 'meal':
        return '🍽️';
      case 'submission':
        return '📸';
      case 'streak':
        return '⚡';
      case 'referral':
        return '👥';
      case 'bonus':
        return '🎁';
      default:
        return '⭐';
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'workout':
        return 'text-blue-400';
      case 'warmup':
        return 'text-orange-400';
      case 'meal':
        return 'text-green-400';
      case 'submission':
        return 'text-purple-400';
      case 'streak':
        return 'text-yellow-400';
      case 'referral':
        return 'text-pink-400';
      case 'bonus':
        return 'text-cyan-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading XP logs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold">XP History</h1>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg px-4 py-2">
              <div className="text-xs text-gray-400">Total XP</div>
              <div className="text-2xl font-bold text-yellow-400">{totalXP.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Workouts</div>
            <div className="text-xl font-bold text-blue-400">
              {logs.filter(l => l.action_type === 'workout').reduce((sum, l) => sum + l.xp_earned, 0).toLocaleString()} XP
            </div>
          </div>
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Warm-ups</div>
            <div className="text-xl font-bold text-orange-400">
              {logs.filter(l => l.action_type === 'warmup').reduce((sum, l) => sum + l.xp_earned, 0).toLocaleString()} XP
            </div>
          </div>
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Meals</div>
            <div className="text-xl font-bold text-green-400">
              {logs.filter(l => l.action_type === 'meal').reduce((sum, l) => sum + l.xp_earned, 0).toLocaleString()} XP
            </div>
          </div>
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Submissions</div>
            <div className="text-xl font-bold text-purple-400">
              {logs.filter(l => l.action_type === 'submission').reduce((sum, l) => sum + l.xp_earned, 0).toLocaleString()} XP
            </div>
          </div>
        </div>

        {/* XP Logs List */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-bold text-white">Activity Log</h2>
            <p className="text-sm text-gray-400 mt-1">Complete history of all XP earned</p>
          </div>

          {logs.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No XP logs yet</p>
              <p className="text-sm mt-2">Start completing activities to earn XP!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-3xl">{getActionIcon(log.action_type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-white capitalize">{log.action_type}</h3>
                          <span className={`text-sm font-bold ${getActionColor(log.action_type)}`}>
                            +{log.xp_earned} XP
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{log.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(log.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
