import Link from 'next/link';
import { InstallPWA } from '@/components/InstallPWA';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* PWA Install Button */}
      <InstallPWA />
      
      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center font-bold text-black text-xl">
            G
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            GoalCoin
          </h1>
        </div>
        <Link 
          href="/auth"
          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-2.5 px-6 rounded-lg hover:opacity-90 transition-all shadow-lg"
        >
          Login
        </Link>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center font-bold text-black text-5xl shadow-2xl">
              G
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent">
            90-Day Fitness Challenge
          </h2>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Track workouts, earn XP, climb the leaderboard
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-6">
              <div className="text-3xl mb-3">💪</div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Daily Workouts</h3>
              <p className="text-gray-400 text-sm">Log your workouts and earn XP for every session</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-6">
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Leaderboard</h3>
              <p className="text-gray-400 text-sm">Compete globally and climb the ranks</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-6">
              <div className="text-3xl mb-3">🔥</div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Streak System</h3>
              <p className="text-gray-400 text-sm">Build your streak and unlock multipliers</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/auth"
              className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-4 px-12 rounded-lg hover:opacity-90 transition-all shadow-lg text-lg"
            >
              Get Started
            </Link>
            <Link 
              href="/auth"
              className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 px-12 rounded-lg transition-all border border-gray-700"
            >
              Login
            </Link>
          </div>

          {/* Footer Note */}
          <p className="mt-12 text-gray-500 text-sm">
            Join the 90-day challenge and transform your fitness journey
          </p>
        </div>
      </main>
    </div>
  );
}