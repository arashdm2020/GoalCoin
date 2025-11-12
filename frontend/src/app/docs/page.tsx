'use client';

import { useRouter } from 'next/navigation';

export default function DocsPage() {
  const router = useRouter();
  const pdfUrl = '/GoalCoin_Whitepaper_v1.pdf';

  return (
    <div className="min-h-screen bg-black text-[#FFD700] flex flex-col items-center justify-start px-4 pt-16">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-glow">Documentation</h1>
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-[#FFD700] transition-colors ripple-on-hover"
          >
            ← Back to Home
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg border border-[#FFD700]/20 p-2" style={{ height: 'calc(100vh - 200px)' }}>
          <iframe
            src={pdfUrl}
            title="GoalCoin Whitepaper v1"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
