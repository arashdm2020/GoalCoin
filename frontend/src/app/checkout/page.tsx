'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../hooks/useToastNotification';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';

interface ChallengeStatus {
  maxParticipants: number;
  currentParticipants: number;
  remainingSpots: number;
  isFull: boolean;
}

// Beta: Only $19 tier enabled
const TIERS = [
  {
    name: 'Beta Entry',
    price: 19,
    features: ['90-Day Challenge Access', 'Weekly Submissions', 'Community Support', 'Leaderboard Access', 'Token Burn Rewards'],
    color: 'from-yellow-500 to-orange-600',
    tier_code: 'TIER_19',
  },
];

export default function CheckoutPage() {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const router = useRouter();
  const { showError, showSuccess, ToastComponent } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      // Fetch challenge status (public)
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
        const statusRes = await fetch(`${backendUrl}/api/challenge/status`);
        if (statusRes.ok) {
          const data = await statusRes.json();
          setChallengeStatus(data);
        }
      } catch (error) {
        console.error('Error fetching challenge status:', error);
      }

      // Fetch user
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth');
        return;
      }

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
        const response = await fetch(`${backendUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchData();
  }, [router]);

  const handlePurchase = async (tierIndex: number) => {
    // Check if challenge is full
    if (challengeStatus?.isFull) {
      showError('This beta is full. Please join the waitlist below.');
      return;
    }

    // Check if user has wallet
    if (!user?.wallet) {
      setSelectedTier(tierIndex);
      setShowWalletModal(true);
      return;
    }

    setLoading(true);
    setSelectedTier(tierIndex);

    try {
      const tier = TIERS[tierIndex];
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const token = localStorage.getItem('auth_token');

      // Create payment
      const response = await fetch(`${backendUrl}/api/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          wallet: user.wallet,
          email: user.email,
          country_code: user.country_code,
          tier: tier.tier_code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.isFull) {
          showError('Challenge is now full! Join the waitlist below.');
          // Refresh status
          const statusRes = await fetch(`${backendUrl}/api/challenge/status`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setChallengeStatus(statusData);
          }
        } else {
          throw new Error(data.error || 'Payment creation failed');
        }
        setLoading(false);
        setSelectedTier(null);
        return;
      }

      // Redirect to CoinPayments
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error: any) {
      showError(error.message || 'Failed to create checkout session');
      setLoading(false);
      setSelectedTier(null);
    }
  };

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;

    setWaitlistLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const response = await fetch(`${backendUrl}/api/challenge/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: waitlistEmail,
          name: user?.handle || user?.email,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        showSuccess('✅ Added to waitlist! We\'ll notify you when spots open.');
        setWaitlistEmail('');
      } else {
        showError(data.message || 'Failed to join waitlist');
      }
    } catch (error) {
      showError('Failed to join waitlist. Please try again.');
    } finally {
      setWaitlistLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#FFD700]">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-[#FFD700] transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Join the Beta Challenge</h1>
          <p className="text-gray-400 text-lg mb-6">
            Transform your life in 90 days
          </p>
          
          {/* Beta Spots Counter */}
          {challengeStatus && (
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-full px-6 py-3 mb-4">
              <span className="text-2xl">🔥</span>
              <div className="text-left">
                <div className="text-sm text-gray-300">Limited Beta Access</div>
                <div className="text-lg font-bold text-orange-400">
                  {challengeStatus.isFull ? (
                    'BETA FULL'
                  ) : (
                    `${challengeStatus.remainingSpots} / ${challengeStatus.maxParticipants} spots left`
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Revenue Split Info */}
        <div className="max-w-2xl mx-auto mb-12 p-6 bg-gray-900 border border-[#FFD700]/20 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">💰 Revenue Distribution</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Prize Pool:</span>
              <span className="font-semibold text-green-400">70%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Treasury (DAO/Buybacks):</span>
              <span className="font-semibold text-blue-400">20%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Burn Pool:</span>
              <span className="font-semibold text-red-400">10%</span>
            </div>
          </div>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
          {TIERS.map((tier, index) => (
            <div
              key={index}
              className="relative bg-gray-900 border border-[#FFD700] rounded-lg p-8 hover:border-[#FFD700]/80 transition-colors"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="px-4 py-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black text-sm font-semibold rounded-full">
                  🔥 Limited Beta
                </span>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="text-5xl font-bold mb-2">
                  ${tier.price}
                  <span className="text-lg text-gray-400"> USDT</span>
                </div>
                <p className="text-sm text-gray-400">One-time payment</p>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePurchase(index)}
                disabled={(loading && selectedTier === index) || challengeStatus?.isFull}
                className={`w-full py-3 bg-gradient-to-r ${tier.color} text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {challengeStatus?.isFull ? '❌ Beta Full' : loading && selectedTier === index ? 'Processing...' : '🚀 Join Beta ($19 USDT)'}
              </button>
            </div>
          ))}
        </div>

        {/* Waitlist Section (shown when full) */}
        {challengeStatus?.isFull && (
          <div className="max-w-2xl mx-auto mt-12 p-8 bg-gradient-to-br from-red-900/30 to-orange-900/30 border border-red-500/50 rounded-lg">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">🔒 Beta is Full</h3>
              <p className="text-gray-300">
                Join the waitlist to be notified when the next batch opens!
              </p>
            </div>
            
            <form onSubmit={handleWaitlist} className="flex gap-3">
              <input
                type="email"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                required
              />
              <button
                type="submit"
                disabled={waitlistLoading}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {waitlistLoading ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
          </div>
        )}

        {/* Payment Info */}
        <div className="max-w-2xl mx-auto mt-12 p-6 bg-gray-900 border border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">💳 Payment Information</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Payments processed via CoinPayments (USDT Polygon)</li>
            <li>• Secure and instant confirmation</li>
            <li>• Limited to 200 beta participants</li>
            <li>• Your spot is reserved immediately after payment</li>
          </ul>
        </div>
      </main>

      {/* Wallet Connect Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-[#FFD700]/30 rounded-lg max-w-md w-full p-8 relative">
            {/* Close button */}
            <button
              onClick={() => setShowWalletModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#FFD700]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <h3 className="text-2xl font-bold text-center mb-4 text-[#FFD700]">
              Wallet Required
            </h3>
            <p className="text-gray-300 text-center mb-6">
              You need to connect your wallet to purchase a tier and receive rewards. 
              Please connect your wallet to continue.
            </p>

            {/* Selected Tier Info */}
            {selectedTier !== null && (
              <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Selected Tier:</span>
                  <span className="text-[#FFD700] font-semibold">{TIERS[selectedTier].name}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white font-bold">${TIERS[selectedTier].price} USDT</span>
                </div>
              </div>
            )}

            {/* Connect Wallet Button */}
            <div className="mb-4">
              <ConnectWalletButton onConnect={(address) => {
                // After wallet connects, close modal and retry purchase
                setShowWalletModal(false);
                // Refresh user data
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              }} />
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setShowWalletModal(false)}
              className="w-full py-3 bg-gray-800 text-gray-300 font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {ToastComponent}
    </div>
  );
}
