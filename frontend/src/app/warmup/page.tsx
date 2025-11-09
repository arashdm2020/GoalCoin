'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WarmupMove {
  id: string;
  name: string;
  duration_seconds: number;
  description: string;
}

interface WarmupRoutine {
  id: string;
  name: string;
  description: string;
  duration_seconds: number;
  moves: WarmupMove[];
}

interface WarmupStats {
  current_streak: number;
  total_sessions: number;
  total_xp_earned: number;
}

export default function WarmupPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<WarmupRoutine[]>([]);
  const [stats, setStats] = useState<WarmupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);

  useEffect(() => {
    fetchWarmupData();
  }, []);

  const fetchWarmupData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch routines
      const routinesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/warmups/routines`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const routinesData = await routinesRes.json();
      setRoutines(routinesData.routines || []);

      // Fetch stats
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/warmups/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsRes.json();
      setStats(statsData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching warmup data:', error);
      setLoading(false);
    }
  };

  const completeWarmup = async (routineId: string) => {
    setCompleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/warmups/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ routine_id: routineId }),
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(`✅ Warm-up completed! +${data.xp_earned} XP`);
        fetchWarmupData(); // Refresh stats
      } else {
        alert(data.error || 'Failed to complete warm-up');
      }
    } catch (error) {
      console.error('Error completing warmup:', error);
      alert('Failed to complete warm-up');
    } finally {
      setCompleting(false);
      setSelectedRoutine(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading warm-ups...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold mb-2">🔥 Warm-Up Sessions</h1>
          <p className="text-gray-400">Complete your daily warm-up to earn XP and maintain your streak</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-orange-500">
              <div className="text-3xl font-bold text-orange-500">{stats.current_streak}</div>
              <div className="text-gray-400">Day Streak 🔥</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold">{stats.total_sessions}</div>
              <div className="text-gray-400">Total Sessions</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold text-yellow-500">{stats.total_xp_earned}</div>
              <div className="text-gray-400">XP Earned</div>
            </div>
          </div>
        )}

        {/* Routines */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Choose Your Routine</h2>
          
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-orange-500 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{routine.name}</h3>
                  <p className="text-gray-400 mb-4">{routine.description}</p>
                  <div className="text-sm text-gray-500">
                    ⏱️ Duration: {Math.floor(routine.duration_seconds / 60)} minutes
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRoutine(routine.id)}
                  disabled={completing}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                >
                  {completing && selectedRoutine === routine.id ? 'Completing...' : 'Complete'}
                </button>
              </div>

              {/* Moves */}
              {selectedRoutine === routine.id && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="font-bold mb-3">Exercises:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {routine.moves.map((move, idx) => (
                      <div key={idx} className="bg-gray-900 p-3 rounded">
                        <div className="font-semibold">{move.name}</div>
                        <div className="text-sm text-gray-400">{move.duration_seconds}s - {move.description}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => completeWarmup(routine.id)}
                      disabled={completing}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-bold"
                    >
                      ✅ Mark as Complete
                    </button>
                    <button
                      onClick={() => setSelectedRoutine(null)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
