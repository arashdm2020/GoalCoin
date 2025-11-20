'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../hooks/useToastNotification';

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
  const { showSuccess, showError, ToastComponent } = useToast();

  useEffect(() => {
    fetchWarmupData();
  }, []);

  const fetchWarmupData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth');
        return;
      }
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      
      // Fetch warmup stats
      const statsResponse = await fetch(`${backendUrl}/api/warmup/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
      
      // Use predefined routines
      const mockRoutines: WarmupRoutine[] = [
        {
          id: '1',
          name: 'Quick Morning Warmup',
          description: 'A gentle 5-minute routine to wake up your body',
          duration_seconds: 300,
          moves: [
            { id: '1', name: 'Arm Circles', duration_seconds: 30, description: 'Forward and backward circles' },
            { id: '2', name: 'Leg Swings', duration_seconds: 30, description: 'Front to back, side to side' },
            { id: '3', name: 'Torso Twists', duration_seconds: 30, description: 'Gentle spinal rotation' },
            { id: '4', name: 'High Knees', duration_seconds: 30, description: 'Lift knees to waist level' },
            { id: '5', name: 'Butt Kicks', duration_seconds: 30, description: 'Heel to glute kicks' },
            { id: '6', name: 'Jumping Jacks', duration_seconds: 30, description: 'Classic cardio warmup' },
            { id: '7', name: 'Shoulder Rolls', duration_seconds: 30, description: 'Forward and backward rolls' },
            { id: '8', name: 'Ankle Circles', duration_seconds: 30, description: 'Both directions, both feet' },
            { id: '9', name: 'Deep Breathing', duration_seconds: 60, description: 'Calm and center yourself' },
            { id: '10', name: 'Light Stretching', duration_seconds: 60, description: 'Full body gentle stretch' }
          ]
        },
        {
          id: '2',
          name: 'Pre-Workout Dynamic',
          description: 'Intensive 10-minute preparation for heavy workouts',
          duration_seconds: 600,
          moves: [
            { id: '11', name: 'Dynamic Squats', duration_seconds: 60, description: 'Bodyweight squats with tempo' },
            { id: '12', name: 'Lunges', duration_seconds: 60, description: 'Alternating forward lunges' },
            { id: '13', name: 'Push-up Prep', duration_seconds: 60, description: 'Incline or knee push-ups' },
            { id: '14', name: 'Plank Hold', duration_seconds: 30, description: 'Core activation' },
            { id: '15', name: 'Mountain Climbers', duration_seconds: 45, description: 'Dynamic core work' },
            { id: '16', name: 'Burpees', duration_seconds: 45, description: 'Full body activation' },
            { id: '17', name: 'Hip Circles', duration_seconds: 30, description: 'Hip mobility' },
            { id: '18', name: 'Arm Swings', duration_seconds: 30, description: 'Cross-body and overhead' },
            { id: '19', name: 'Leg Kicks', duration_seconds: 60, description: 'Dynamic leg raises' },
            { id: '20', name: 'Cool Down Walk', duration_seconds: 120, description: 'Light movement to finish' }
          ]
        }
      ];

      setRoutines(mockRoutines);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching warmup data:', error);
      setLoading(false);
    }
  };

  const completeWarmup = async (routineId: string) => {
    setCompleting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      
      const routine = routines.find(r => r.id === routineId);
      
      const response = await fetch(`${backendUrl}/api/warmup/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          routine_name: routine?.name,
          duration_seconds: routine?.duration_seconds,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        showSuccess(`Warm-up completed! +${data.xp_earned || 50} XP earned`);
        
        // Refresh stats
        await fetchWarmupData();
      } else {
        throw new Error('Failed to complete warmup');
      }
    } catch (error) {
      console.error('Error completing warmup:', error);
      showError('Failed to complete warm-up');
    } finally {
      setCompleting(false);
      setSelectedRoutine(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-gray-800/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">Warm-Up Sessions</h1>
              <p className="text-sm text-gray-400">Complete your daily warm-up to earn XP and maintain your streak</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">

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
              id={`routine-${routine.id}`}
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
                  onClick={() => {
                    setSelectedRoutine(routine.id);
                    // Scroll to routine after a short delay to let it expand
                    setTimeout(() => {
                      const element = document.getElementById(`routine-${routine.id}`);
                      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                  }}
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
      </main>
      {ToastComponent}
    </div>
  );
}
