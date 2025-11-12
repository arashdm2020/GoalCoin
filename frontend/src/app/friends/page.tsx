'use client';

import { useRouter } from 'next/navigation';

export default function FriendsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-[#FFD700] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-2 text-glow">Friends</h1>
        <p className="text-gray-400 text-lg mb-8">Coming Soon</p>

        <div className="bg-gray-900 rounded-lg border border-[#FFD700]/20 p-8">
          <p className="text-gray-300 mb-4">
            The 'Challenge a Friend' feature is currently disabled but will be available in a future update.
          </p>
          <button
            disabled
            className="w-full py-3 bg-gray-700 text-gray-500 font-semibold rounded-lg cursor-not-allowed"
          >
            Challenge a Friend
          </button>
        </div>

        <button
          onClick={() => router.push('/')}
          className="mt-8 w-full text-center text-gray-400 hover:text-[#FFD700] transition-colors ripple-on-hover"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
