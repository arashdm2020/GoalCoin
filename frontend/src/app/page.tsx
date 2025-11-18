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

          {/* Pricing Tiers */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold mb-8">Choose Your Challenge Tier</h3>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Tier 1: $19 */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 rounded-xl p-8 hover:border-yellow-500 transition-all">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-yellow-400 mb-2">$19</div>
                  <div className="text-sm text-gray-400">Entry Tier</div>
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
                    <span className="text-orange-400 font-bold">🔥</span>
                    <span className="text-sm font-semibold">1.5X Burn Multiplier</span>
                  </div>
                </div>
                <Link href="/auth" className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg text-center transition-all">
                  Start Challenge
                </Link>
              </div>

              {/* Tier 2: $35 */}
              <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500 rounded-xl p-8 transform scale-105 shadow-2xl relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-xs font-bold">
                  POPULAR
                </div>
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-yellow-400 mb-2">$35</div>
                  <div className="text-sm text-gray-400">Pro Tier</div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm">Everything in Entry</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm">Priority Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm">Exclusive Content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 font-bold">🔥🔥</span>
                    <span className="text-sm font-semibold">2.0X Burn Multiplier</span>
                  </div>
                </div>
                <Link href="/auth" className="block w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-3 rounded-lg text-center transition-all hover:opacity-90">
                  Start Challenge
                </Link>
              </div>

              {/* Tier 3: $49 */}
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500 rounded-xl p-8 hover:border-purple-400 transition-all">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-purple-400 mb-2">$49</div>
                  <div className="text-sm text-gray-400">Elite Tier</div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm">Everything in Pro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm">1-on-1 Coaching</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm">Custom Meal Plans</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 font-bold">🔥🔥🔥</span>
                    <span className="text-sm font-semibold">2.5X Burn Multiplier</span>
                  </div>
                </div>
                <Link href="/auth" className="block w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg text-center transition-all">
                  Start Challenge
                </Link>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-4 gap-6 mb-12 text-left">
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
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Burn Multiplier</h3>
              <p className="text-gray-400 text-sm">Higher tiers unlock bigger XP multipliers</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg p-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Track Progress</h3>
              <p className="text-gray-400 text-sm">Monitor your streak, XP, and tier status</p>
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