'use client';

import { useRouter } from 'next/navigation';

export default function PartnersPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-[#FFD700] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-2 text-glow">Partners</h1>
        <p className="text-gray-400 text-lg mb-8">Coming Soon</p>

        <div className="bg-gray-900 rounded-lg border border-[#FFD700]/20 p-8">
          <p className="text-gray-300">
            We are building a strong network of partners. Information about our collaborations will be available here.
          </p>
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
