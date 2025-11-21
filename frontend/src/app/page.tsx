'use client';

import Link from 'next/link';
import { InstallPWA } from '@/components/InstallPWA';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading animation
    setTimeout(() => setIsLoading(false), 1500);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Loading Animation */}
      {isLoading && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center font-bold text-black text-6xl animate-pulse shadow-2xl">
              G
            </div>
            <div className="absolute inset-0 w-32 h-32 border-4 border-yellow-400 rounded-full animate-spin" style={{ borderTopColor: 'transparent' }}></div>
          </div>
        </div>
      )}

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
      <main className="container mx-auto px-6 py-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Icon */}
          <div className="mb-4 flex justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center font-bold text-black text-5xl shadow-2xl">
              G
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent">
            90-Day Fitness Challenge
          </h2>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Track workouts, earn XP, climb the leaderboard
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400">90</div>
              <div className="text-sm text-gray-500">Days Challenge</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-400">1.20X</div>
              <div className="text-sm text-gray-500">Max Multiplier</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400">$35</div>
              <div className="text-sm text-gray-500">Staked Tier</div>
            </div>
          </div>

          {/* Pricing Tiers */}
          <div id="pricing" className="mb-8">
            <h3 className="text-3xl font-bold mb-6">Choose Your Challenge Tier</h3>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Tier 1: $19 - Base Member */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-blue-500/50 rounded-xl p-8 hover:border-blue-500 transition-all shadow-xl">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-blue-400 mb-2">$19</div>
                  <div className="text-sm text-gray-400">Base Member</div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm">90-Day Challenge Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm">Weekly Submissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm">XP & Leaderboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm">5 Day Streak Cap</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 font-bold">🔥</span>
                    <span className="text-sm font-semibold">1.00X Burn Multiplier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 font-bold">⚡</span>
                    <span className="text-sm font-semibold">1.00X XP Multiplier</span>
                  </div>
                </div>
                  <button 
                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-center transition-all"
                  >
                    Start Challenge
                  </button>
                </div>
              </div>

              {/* Tier 2: $35 - Staked Member */}
              <div className="relative group transform md:scale-105">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500 rounded-xl p-8 shadow-2xl">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-xs font-bold z-10">
                  RECOMMENDED
                </div>
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-purple-400 mb-2">$35</div>
                  <div className="text-sm text-gray-400">Staked Member</div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm">Everything in Base</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm">7 Day Streak Cap</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm">Premium Weekly Tips</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold">🌟</span>
                    <span className="text-sm font-semibold">Early Access: Phase 2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 font-bold">🔥</span>
                    <span className="text-sm font-semibold">1.20X Burn Multiplier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 font-bold">⚡</span>
                    <span className="text-sm font-semibold">1.10X XP Multiplier</span>
                  </div>
                </div>
                  <Link href="/auth" className="block w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-lg text-center transition-all hover:opacity-90">
                    Start Challenge
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Features - Horizontal Cards */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold mb-8">Why GoalCoin?</h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
              <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6 hover:border-yellow-500 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-500/20 transition-all">
                    <span className="text-3xl">💪</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Daily Workouts</h3>
                    <p className="text-gray-400">Log your workouts and earn XP for every session. Build consistency and track your progress.</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6 hover:border-yellow-500 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-500/20 transition-all">
                    <span className="text-3xl">🏆</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Global Leaderboard</h3>
                    <p className="text-gray-400">Compete with fitness enthusiasts worldwide. Climb the ranks and prove your dedication.</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6 hover:border-orange-500 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/20 transition-all">
                    <span className="text-3xl">🔥</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Burn Multiplier</h3>
                    <p className="text-gray-400">Higher tiers unlock bigger XP multipliers. Maximize your rewards with premium membership.</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6 hover:border-yellow-500 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-500/20 transition-all">
                    <span className="text-3xl">📊</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Track Progress</h3>
                    <p className="text-gray-400">Monitor your streak, XP, and tier status. Visualize your transformation journey.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA Section */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-8 mb-8">
            <h3 className="text-3xl font-bold mb-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Ready to Transform Your Life in 90 Days?
              </span>
            </h3>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Join thousands of members who are already crushing their fitness goals. Start your transformation journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-4 px-12 rounded-lg hover:opacity-90 transition-all shadow-lg text-lg"
              >
                View Pricing Plans
              </button>
              <Link 
                href="/auth"
                className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 px-12 rounded-lg transition-all border border-gray-700"
              >
                Login to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 GoalCoin. Transform your life in 90 days.
          </p>
        </div>
      </footer>
    </div>
  );
}