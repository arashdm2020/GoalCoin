'use client';

import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-[#FFD700] flex flex-col items-center justify-start px-4 pt-16">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-glow">Support</h1>
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-[#FFD700] transition-colors ripple-on-hover"
          >
            ← Back to Home
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg border border-[#FFD700]/20 p-8">
          <p className="text-gray-300 mb-6">
            For any questions, issues, or feedback, please reach out to our support team.
          </p>
          <a 
            href="mailto:support@goal.software"
            className="inline-block w-full text-center py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity ripple-on-hover"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
