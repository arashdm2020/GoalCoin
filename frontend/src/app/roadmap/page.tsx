'use client';

import { useRouter } from 'next/navigation';

// Placeholder Animation Components
const IgnitionAnimation = () => (
  <svg className="w-24 h-24 text-gray-500" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
    {/* Simple representation of a walking silhouette */}
    <circle cx="50" cy="30" r="10" />
    <path d="M50 40V70" />
    <path d="M50 50L30 70" />
    <path d="M50 50L70 70" />
    <path d="M50 70L30 90" />
    <path d="M50 70L70 90" />
  </svg>
);

const ExpansionAnimation = () => (
  <svg className="w-24 h-24 text-gray-500" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
    {/* Simple representation of a gold ring */}
    <circle cx="50" cy="50" r="40" />
  </svg>
);

const AscensionAnimation = () => (
  <svg className="w-24 h-24 text-gray-500" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
    {/* Simple representation of a globe and GC logo */}
    <circle cx="50" cy="50" r="40" />
    <path d="M50 10V90" />
    <path d="M10 50H90" />
    <path d="M20 30Q50 10 80 30" />
    <path d="M20 70Q50 90 80 70" />
  </svg>
);

const RoadmapNode = ({ phase, title, description, children }: { 
  phase: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="group relative flex flex-col items-center text-center p-8 bg-gray-900/50 rounded-lg border border-transparent hover:border-[#FFD700]/50 transition-all duration-300 ripple-on-hover">
    <div className="w-32 h-32 mb-4 flex items-center justify-center">
      {children}
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
          >
            <IgnitionAnimation />
          </RoadmapNode>
          <RoadmapNode 
            phase="Phase 2"
            title="Expansion"
            description="Unity · Competition · Energy"
          >
            <ExpansionAnimation />
          </RoadmapNode>
          <RoadmapNode 
            phase="Phase 3"
            title="Ascension"
            description="Empire · Legacy · GoalCoin"
          >
            <AscensionAnimation />
          </RoadmapNode>
        </div>
      </div>
    </div>
  );
}
