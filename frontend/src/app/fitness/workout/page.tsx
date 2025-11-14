'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

export default function WorkoutPage() {
  const [workoutType, setWorkoutType] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch(`${backendUrl}/api/fitness/workout/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          workoutType: workoutType,
          durationMin: parseInt(duration),
          notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`💪 Workout logged! +${data.xp_earned} XP earned!`, 'success');
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to log workout', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#FFD700]">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-[#FFD700] transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">💪 Log Your Workout</h1>
            <p className="text-gray-400 text-lg">
              Track your progress and earn XP
            </p>
          </div>

          <div className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Workout Type</label>
                <select
                  value={workoutType}
                  onChange={(e) => setWorkoutType(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                  required
                >
                  <option value="">Select workout type</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Strength">Strength Training</option>
                  <option value="HIIT">HIIT</option>
                  <option value="Yoga">Yoga</option>
                  <option value="CrossFit">CrossFit</option>
                  <option value="Running">Running</option>
                  <option value="Cycling">Cycling</option>
                  <option value="Swimming">Swimming</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                  placeholder="30"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700] h-32 resize-none"
                  placeholder="How did it go? Any achievements?"
                />
              </div>

              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-200">
                  💡 <strong>Tip:</strong> Logging your workout earns you +20 XP and maintains your streak!
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Logging...' : 'Log Workout (+20 XP)'}
              </button>
            </form>
          </div>
        </div>
      </main>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
