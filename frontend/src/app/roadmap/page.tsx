'use client';

import { useRouter } from 'next/navigation';

const RoadmapNode = ({ phase, title, description, animationPlaceholder }: {
  phase: string;
  title: string;
  description: string;
  animationPlaceholder: string;
}) => (
  <div className="group relative flex flex-col items-center text-center p-8 bg-gray-900/50 rounded-lg border border-transparent hover:border-[#FFD700]/50 transition-all duration-300 ripple-on-hover">
    {/* Placeholder for SVG/Lottie Animation */}
    <div className="w-32 h-32 bg-gray-800 rounded-full mb-4 flex items-center justify-center">
      <p className="text-gray-500">{animationPlaceholder}</p>
    </div>
    <h2 className="text-2xl font-bold text-[#FFD700] mb-2">{phase}</h2>
    <h3 className="text-xl font-semibold text-white">{title}</h3>
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <p className="text-lg font-orbitron tracking-widest">{description}</p>
    </div>
  </div>
);

export default function RoadmapPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-6xl">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-5xl font-orbitron font-bold text-white text-glow">Roadmap</h1>
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-[#FFD700] transition-colors ripple-on-hover"
          >
            ← Back to Home
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-center">
          <RoadmapNode 
            phase="Phase 1"
            title="Ignition"
            description="Origin · Will · Spark"
            animationPlaceholder="Walking Silhouette"
          />
          <RoadmapNode 
            phase="Phase 2"
            title="Expansion"
            description="Unity · Competition · Energy"
            animationPlaceholder="10 Sports in Gold Ring"
          />
          <RoadmapNode 
            phase="Phase 3"
            title="Ascension"
            description="Empire · Legacy · GoalCoin"
            animationPlaceholder="Globe + GC Logo"
          />
        </div>
      </div>
    </div>
  );
}
