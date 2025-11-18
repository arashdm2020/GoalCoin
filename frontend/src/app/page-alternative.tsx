'use client';

import Link from 'next/link';
import { InstallPWA } from '@/components/InstallPWA';
import { useState, useEffect } from 'react';

export default function HomeAlternative() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hero loader animation
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Loader Animation */}
      {isLoading && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative">
            {/* Animated G with glow effect */}
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center font-bold text-black text-6xl animate-pulse shadow-2xl">
              G
            </div>
            {/* Spinning ring */}
            <div className="absolute inset-0 w-32 h-32 border-4 border-yellow-400 rounded-full animate-spin" style={{ borderTopColor: 'transparent' }}></div>
            {/* Outer glow ring */}
            <div className="absolute inset-0 w-32 h-32 border-2 border-orange-500/30 rounded-full animate-ping"></div>
          </div>
        </div>
      )}

      {/* PWA Install Button */}
      <InstallPWA />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-lg border-b border-yellow-500/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center font-bold text-black text-xl shadow-lg">
              G
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              GoalCoin
            </span>
          </div>
          <Link
            href="/auth"
            className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-full hover:shadow-lg hover:shadow-yellow-500/50 transition-all"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section - Full Screen */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
          <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Main headline with gradient */}
            <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
              <span className="block bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent animate-gradient">
                Transform Your Life
              </span>
              <span className="block text-white mt-2">In 90 Days</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto">
              Join the ultimate fitness challenge. Track workouts, earn XP, compete globally, and unlock exclusive rewards.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap justify-center gap-8 mb-12">
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-400">90</div>
                <div className="text-sm text-gray-500">Days Challenge</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-400">2.5X</div>
                <div className="text-sm text-gray-500">Max Multiplier</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-400">$49</div>
                <div className="text-sm text-gray-500">Elite Tier</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth"
                className="px-10 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-full text-lg hover:shadow-2xl hover:shadow-yellow-500/50 transition-all transform hover:scale-105"
              >
                Start Your Journey
              </Link>
              <Link
                href="/auth"
                className="px-10 py-4 bg-transparent border-2 border-yellow-500 text-yellow-400 font-bold rounded-full text-lg hover:bg-yellow-500/10 transition-all"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-yellow-500 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-yellow-500 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Cards Layout */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Choose Your Path
              </span>
            </h2>
            <p className="text-xl text-gray-400">Select the tier that matches your commitment</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Entry Tier */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-8 hover:border-yellow-500 transition-all">
                <div className="text-center mb-8">
                  <div className="text-gray-400 text-sm mb-2">ENTRY</div>
                  <div className="text-6xl font-bold text-white mb-2">$19</div>
                  <div className="text-gray-500 text-sm">per challenge</div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-yellow-400 text-sm">✓</span>
                    </div>
                    <span className="text-gray-300">90-Day Challenge Access</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-yellow-400 text-sm">✓</span>
                    </div>
                    <span className="text-gray-300">Weekly Submissions</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-yellow-400 text-sm">✓</span>
                    </div>
                    <span className="text-gray-300">XP & Leaderboard</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-400 text-sm">🔥</span>
                    </div>
                    <span className="text-white font-semibold">1.5X Burn Multiplier</span>
                  </div>
                </div>

                <Link
                  href="/auth"
                  className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg text-center transition-all"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Pro Tier - Highlighted */}
            <div className="relative group transform md:scale-110">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold rounded-full">
                MOST POPULAR
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-500 rounded-2xl p-8">
                <div className="text-center mb-8">
                  <div className="text-yellow-400 text-sm mb-2">PRO</div>
                  <div className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">$35</div>
                  <div className="text-gray-500 text-sm">per challenge</div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-yellow-400 text-sm">✓</span>
                    </div>
                    <span className="text-gray-300">Everything in Entry</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-yellow-400 text-sm">✓</span>
                    </div>
                    <span className="text-gray-300">Priority Support</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-yellow-400 text-sm">✓</span>
                    </div>
                    <span className="text-gray-300">Exclusive Content</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-400 text-sm">🔥</span>
                    </div>
                    <span className="text-white font-semibold">2.0X Burn Multiplier</span>
                  </div>
                </div>

                <Link
                  href="/auth"
                  className="block w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-lg text-center hover:shadow-lg hover:shadow-yellow-500/50 transition-all"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Elite Tier */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-gray-900 border border-purple-500 rounded-2xl p-8 hover:border-purple-400 transition-all">
                <div className="text-center mb-8">
                  <div className="text-purple-400 text-sm mb-2">ELITE</div>
                  <div className="text-6xl font-bold text-purple-400 mb-2">$49</div>
                  <div className="text-gray-500 text-sm">per challenge</div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-400 text-sm">✓</span>
                    </div>
                    <span className="text-gray-300">Everything in Pro</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-400 text-sm">✓</span>
                    </div>
                    <span className="text-gray-300">1-on-1 Coaching</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-400 text-sm">✓</span>
                    </div>
                    <span className="text-gray-300">Custom Meal Plans</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-400 text-sm">🔥</span>
                    </div>
                    <span className="text-white font-semibold">2.5X Burn Multiplier</span>
                  </div>
                </div>

                <Link
                  href="/auth"
                  className="block w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-center transition-all"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Horizontal Cards */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Why GoalCoin?
              </span>
            </h2>
            <p className="text-xl text-gray-400">Everything you need to succeed</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Feature 1 */}
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

            {/* Feature 2 */}
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

            {/* Feature 3 */}
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

            {/* Feature 4 */}
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
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Ready to Transform?
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of members who are already crushing their fitness goals
          </p>
          <Link
            href="/auth"
            className="inline-block px-12 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-full text-lg hover:shadow-2xl hover:shadow-yellow-500/50 transition-all transform hover:scale-105"
          >
            Start Your 90-Day Challenge
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-black border-t border-gray-800">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
          <p>© 2025 GoalCoin. Transform your life in 90 days.</p>
        </div>
      </footer>
    </div>
  );
}
