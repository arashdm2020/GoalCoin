'use client';

import { useRouter } from 'next/navigation';

export default function TransparencyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-[#FFD700] flex flex-col items-center justify-start px-4 pt-16">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-glow">Transparency</h1>
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-[#FFD700] transition-colors ripple-on-hover"
          >
            ← Back to Home
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg border border-[#FFD700]/20 p-8">
          <h2 className="text-2xl font-bold mb-4">DAO Burn Reports</h2>
          <p className="text-gray-400 mb-6">Future reports from the GoalCoin DAO will be published here to ensure full transparency.</p>
          
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-lg font-semibold">Q4 2025 Report</p>
              <p className="text-sm text-gray-500">Coming Soon</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-lg font-semibold">Q1 2026 Report</p>
              <p className="text-sm text-gray-500">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
