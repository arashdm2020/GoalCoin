'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useToast } from '../../hooks/useToastNotification';
import { MobileWalletConnect } from '../../components/MobileWalletConnect';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { showSuccess, showError, ToastComponent } = useToast();
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

  // Listen for wallet connection from WalletConnect
  useEffect(() => {
    if (isConnected && address) {
      console.log('[WALLET-CONNECT] Wallet connected:', address);
      setWallet(address);
      setError('');
      showSuccess('Wallet connected successfully!');
    }
  }, [isConnected, address]);

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

        // Strict checking for profile completion
        const hasWallet = user.wallet && user.wallet.trim() !== '';
        const hasHandle = user.handle && user.handle.trim() !== '';
        const hasCountry = user.country_code && user.country_code.trim() !== '';

        console.log('[COMPLETE-PROFILE] Profile status:', {
          hasWallet,
          hasHandle,
          hasCountry,
          wallet: user.wallet,
          handle: user.handle,
          country_code: user.country_code
        });

        // If profile is complete, redirect to dashboard
        if (hasWallet && hasHandle && hasCountry) {
          console.log('[COMPLETE-PROFILE] Profile complete, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        // Set existing data
        setHandle(user.handle || '');
        setCountryCode(user.country_code || '');
        setWallet(user.wallet || '');
        setEmailVerified(user.email_verified || false);
        
        console.log('[COMPLETE-PROFILE] Profile incomplete, staying on page');
      }
    } catch (error) {
      console.error('[COMPLETE-PROFILE] Error checking profile status:', error);
    }
  };

  const handleConnectWallet = async () => {
    try {
      // Check if on mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const { ethereum } = window as any;
      
      // On mobile, try to open wallet app directly via deep link
      if (isMobile && (!ethereum || !ethereum.isMetaMask)) {
        // Try to open MetaMask app with deep link
        const currentUrl = window.location.href;
        const metamaskDeepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
        
        // Attempt to open MetaMask app
        window.location.href = metamaskDeepLink;
        
        // Show message after attempting to open
        setTimeout(() => {
          setError('Opening wallet app... If it doesn\'t open, please use your wallet app browser or WalletConnect');
        }, 1000);
        
        return;
      }
      
      // On desktop, check if Web3 wallet is installed
      if (!isMobile && !ethereum) {
        setError('Please install a Web3 wallet (MetaMask recommended)');
        window.open('https://metamask.io/download/', '_blank');
        return;
      }
      
      // If ethereum exists, proceed with connection (works with MetaMask and other wallets)
      if (!ethereum) {
        setError('No Web3 wallet detected');
        return;
      }

      // Polygon network configuration
      const polygonChainId = '0x89'; // 137 in hex
      const polygonConfig = {
        chainId: polygonChainId,
        chainName: 'Polygon Mainnet',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        rpcUrls: ['https://polygon-rpc.com/'],
        blockExplorerUrls: ['https://polygonscan.com/'],
      };

      // Check current network
      const currentChainId = await ethereum.request({ method: 'eth_chainId' });

      // If not on Polygon, switch or add network
      if (currentChainId !== polygonChainId) {
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: polygonChainId }],
          });
        } catch (switchError: any) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [polygonConfig],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Request account access
      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts && accounts.length > 0) {
        setWallet(accounts[0]);
        setError('');
        
        // Show success message with network info
        showSuccess('Wallet connected to Polygon Network! You can now use USDT on Polygon for payments.');
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      if (err.code === 4001) {
        setError('Please approve the connection request in your wallet');
      } else if (err.code === -32002) {
        setError('Please check your wallet - a connection request is already pending');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
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
              {/* Network Info */}
              <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🔗</span>
                  <h3 className="font-bold text-purple-400">Network: Polygon (MATIC)</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Payments are processed using <strong className="text-white">USDT on Polygon Network</strong>
                </p>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 mb-4">
                  Connect your Web3 wallet. We'll automatically switch to Polygon Network for USDT payments.
                </p>
                
                {!wallet ? (
                  <>
                    {/* Show MobileWalletConnect on mobile, regular button on desktop */}
                    {typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? (
                      <MobileWalletConnect
                        onSuccess={(address) => {
                          setWallet(address);
                          showSuccess('Wallet connected successfully!');
                        }}
                        onError={(error) => {
                          setError(error);
                          showError(error);
                        }}
                      />
                    ) : (
                      <button
                        onClick={handleConnectWallet}
                        className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        <span>🔗</span>
                        Connect Wallet (Polygon)
                      </button>
                    )}
                  </>
                ) : (
                  <div className="bg-green-500/10 border border-green-500 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">✅</div>
                      <div className="flex-1">
                        <div className="font-semibold text-green-500">Wallet Connected to Polygon</div>
                        <div className="text-sm text-gray-400 font-mono">
                          {wallet.slice(0, 8)}...{wallet.slice(-6)}
                        </div>
                        <div className="text-xs text-purple-400 mt-1">
                          Ready for USDT payments
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
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
                
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-all"
                >
                  Skip Wallet Connection (Complete Later)
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
      {ToastComponent}
    </div>
  );
}
