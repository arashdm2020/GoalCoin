'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Removed ConnectWalletButton import - using manual wallet connection

export default function CompleteProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [handle, setHandle] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [wallet, setWallet] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth');
      return;
    }

    // Check if profile is already complete
    checkProfileStatus();
  }, []);

  const checkProfileStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      
      const response = await fetch(`${backendUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.user;

        // If profile is complete, redirect to dashboard
        if (user.wallet && user.handle && user.country_code) {
          router.push('/dashboard');
          return;
        }

        // Set existing data
        setHandle(user.handle || '');
        setCountryCode(user.country_code || '');
        setWallet(user.wallet || '');
        setEmailVerified(user.email_verified || false);
      }
    } catch (error) {
      console.error('Error checking profile status:', error);
    }
  };

  const handleConnectWallet = async () => {
    try {
      // Check if Phantom wallet is installed
      const { solana } = window as any;
      
      if (!solana || !solana.isPhantom) {
        setError('Please install Phantom wallet first');
        window.open('https://phantom.app/', '_blank');
        return;
      }

      // Connect to Phantom
      const response = await solana.connect();
      const address = response.publicKey.toString();
      
      setWallet(address);
      setError('');
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError('Failed to connect wallet');
    }
  };

  const handleSubmitProfile = async () => {
    if (!handle || !countryCode) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

      const response = await fetch(`${backendUrl}/api/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          handle,
          country_code: countryCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkWallet = async () => {
    if (!wallet) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

      const response = await fetch(`${backendUrl}/api/auth/link-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ wallet }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to link wallet');
      }

      // Profile complete! Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-gray-400">
            {step === 1 ? 'Step 1 of 2: Basic Information' : 'Step 2 of 2: Connect Wallet'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${step >= 1 ? 'text-orange-500' : 'text-gray-500'}`}>
              Basic Info
            </span>
            <span className={`text-sm ${step >= 2 ? 'text-orange-500' : 'text-gray-500'}`}>
              Connect Wallet
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Username / Handle <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  required
                >
                  <option value="">Select your country</option>
                  <option value="US">United States</option>
                  <option value="IR">Iran</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="ES">Spain</option>
                  <option value="IT">Italy</option>
                  <option value="JP">Japan</option>
                  <option value="KR">South Korea</option>
                  <option value="BR">Brazil</option>
                  <option value="MX">Mexico</option>
                  <option value="IN">India</option>
                  <option value="CN">China</option>
                </select>
              </div>

              <button
                onClick={handleSubmitProfile}
                disabled={loading || !handle || !countryCode}
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Continue to Wallet Connection'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Connect Wallet */}
        {step === 2 && (
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6">Connect Your Wallet</h2>
            
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 mb-4">
                  Connect your Solana wallet to participate in the 90-Day Challenge and earn rewards.
                </p>
                
                {!wallet ? (
                  <button
                    onClick={handleConnectWallet}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <span>👻</span>
                    Connect Phantom Wallet
                  </button>
                ) : (
                  <div className="bg-green-500/10 border border-green-500 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">✅</div>
                      <div>
                        <div className="font-semibold text-green-500">Wallet Connected</div>
                        <div className="text-sm text-gray-400 font-mono">
                          {wallet.slice(0, 8)}...{wallet.slice(-6)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleLinkWallet}
                  disabled={loading || !wallet}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Completing...' : 'Complete Profile'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Skip for now (optional) */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white text-sm underline"
          >
            Skip for now (you can complete this later)
          </button>
        </div>
      </div>
    </div>
  );
}
