'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Capture referral code from URL
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      // Store in localStorage for later use
      localStorage.setItem('referral_code', ref);
      console.log('[REFERRAL] Captured referral code:', ref);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

      // Include referral code in registration
      const body: any = { email, password };
      if (!isLogin && referralCode) {
        body.referral_code = referralCode;
        console.log('[REFERRAL] Including referral code in registration:', referralCode);
      }

      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store JWT token
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on action
      if (isLogin) {
        // Login: check if profile is complete
        if (data.user.wallet && data.user.handle && data.user.country_code) {
          router.push('/dashboard');
        } else {
          router.push('/complete-profile');
        }
      } else {
        // Register: always go to complete profile
        router.push('/complete-profile');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex items-start md:items-center justify-center px-4 py-8 md:py-8 overflow-y-auto">
      <div className="max-w-md w-full my-auto">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center font-bold text-black text-3xl shadow-2xl">
              G
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            GoalCoin
          </h1>
          <p className="text-gray-400 text-sm">90-Day Fitness Challenge</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur rounded-lg border border-gray-800 p-4 md:p-6 shadow-2xl safe-area-inset">
          {/* Tab Switcher */}
          <div className="flex mb-4 md:mb-6 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                isLogin
                  ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                !isLogin
                  ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 md:mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700] text-base"
                placeholder="your@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 md:mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700] text-base"
                placeholder="Min 6 characters"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                minLength={6}
              />
            </div>

            {!isLogin && (
              <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
                <p className="text-sm text-blue-400">
                  ℹ️ After registration, you'll complete your profile with username, country, and wallet connection.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>

          {/* Back to Home */}
          <button
            onClick={() => router.push('/')}
            className="mt-4 w-full text-center text-gray-400 hover:text-[#FFD700] transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
