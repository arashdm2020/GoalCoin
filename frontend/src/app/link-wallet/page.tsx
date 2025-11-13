'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useSignMessage } from 'wagmi';

export default function LinkWalletPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [signed, setSigned] = useState(false);
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { signMessage } = useSignMessage();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth');
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // If already has wallet, redirect to dashboard
      if (parsedUser.wallet) {
        router.push('/dashboard');
      }
    }
  }, [router]);

  // Remove automatic linking - require manual signature

  const handleSignAndLinkWallet = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);

    try {
      // Create message to sign
      const message = `I want to link this wallet to my GoalCoin account.\n\nWallet: ${address}\nUser: ${user.email || user.handle}\nTimestamp: ${Date.now()}`;

      // Request signature
      let signature: string = '';
      try {
        await new Promise<void>((resolve, reject) => {
          signMessage(
            { message },
            {
              onSuccess: (data) => {
                signature = data;
                resolve();
              },
              onError: (error) => {
                reject(error);
              },
            }
          );
        });
        
        if (!signature) {
          throw new Error('Signature required to link wallet');
        }
      } catch (signError: any) {
        throw new Error(signError.message || 'Signature required to link wallet');
      }

      setSigned(true);

      // Send to backend with signature
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${backendUrl}/api/auth/link-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: user.email,
          wallet: address,
          signature: signature,
          message: message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local storage
        const updatedUser = { ...user, wallet: address };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        alert('✅ Wallet connected and verified successfully!');
        router.push('/dashboard');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      setSigned(false);
      if (error.message.includes('User rejected')) {
        alert('Wallet signature is required to link your wallet');
      } else {
        alert(error.message || 'Failed to link wallet');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#FFD700] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🔗 Connect Your Wallet</h1>
          <p className="text-gray-400 text-lg">
            Link your wallet to make payments and participate in the challenge
          </p>
        </div>

        <div className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-8">
          {user && (
            <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-200">
                <strong>Current Account:</strong>
              </p>
              <p className="text-sm text-blue-100 mt-1">
                {user.email || user.handle}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {!isConnected && (
              <div className="p-4 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-200">
                  <strong>Step 1:</strong> Connect your wallet using the button in the top right corner
                </p>
              </div>
            )}

            {isConnected && address && !signed && (
              <div className="space-y-4">
                <div className="p-4 bg-green-900/30 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-200">
                    <strong>✓ Wallet Connected:</strong>
                  </p>
                  <p className="text-xs text-green-100 mt-1 font-mono">
                    {address}
                  </p>
                </div>
                
                <div className="p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-200">
                    <strong>Step 2:</strong> Sign a message to verify wallet ownership
                  </p>
                  <p className="text-xs text-blue-100 mt-1">
                    This signature proves you own this wallet address
                  </p>
                </div>

                <button
                  onClick={handleSignAndLinkWallet}
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing & Linking...' : '✍️ Sign Message & Link Wallet'}
                </button>
              </div>
            )}

            {signed && (
              <div className="p-4 bg-green-900/30 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-200">
                  <strong>✅ Wallet Successfully Linked!</strong>
                </p>
                <p className="text-xs text-green-100 mt-1">
                  Your wallet has been verified and linked to your account
                </p>
              </div>
            )}

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">💡 Why link a wallet?</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Make crypto payments for challenge tiers</li>
            <li>• Receive rewards and prizes</li>
            <li>• Participate in DAO governance</li>
            <li>• Track your on-chain achievements</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
