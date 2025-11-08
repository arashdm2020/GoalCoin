'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WarmupSession {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  video_url?: string;
  difficulty: string;
}

export default function WarmupPage() {
  const [sessions, setSessions] = useState<WarmupSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<WarmupSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth');
      return;
    }

    fetchSessions();
  }, [router]);

  const fetchSessions = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const response = await fetch(`${backendUrl}/api/fitness/warmup-sessions`);
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedSession) return;

    setCompleting(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch(`${backendUrl}/api/fitness/warmup/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          warmup_session_id: selectedSession.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`🎉 Warmup completed! +${data.xp_earned} XP earned!`);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error logging warmup:', error);
      alert('Failed to log warmup');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-[#FFD700] flex items-center justify-center">
        <div className="text-xl">Loading warmup sessions...</div>
      </div>
    );
  }

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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">🔥 Warm-Up Sessions</h1>
          <p className="text-gray-400 text-lg">
            Start your day with a 5-8 minute warm-up
          </p>
        </div>

        {!selectedSession ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-6 hover:border-[#FFD700]/50 transition-colors cursor-pointer"
                onClick={() => setSelectedSession(session)}
              >
                <h3 className="text-xl font-semibold mb-2">{session.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{session.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#FFD700]">{session.duration_minutes} min</span>
                  <span className="px-3 py-1 bg-gray-800 rounded-full">
                    {session.difficulty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-8">
              <h2 className="text-3xl font-bold mb-4">{selectedSession.title}</h2>
              <p className="text-gray-400 mb-6">{selectedSession.description}</p>

              {selectedSession.video_url && (
                <div className="mb-6 aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Video Player: {selectedSession.video_url}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="flex-1 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Choose Different Session
                </button>
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="flex-1 py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {completing ? 'Completing...' : 'Complete Warmup (+10 XP)'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
