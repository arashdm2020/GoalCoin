'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';

export default function LinkWalletPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { address, isConnected } = useAccount();

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

  useEffect(() => {
    if (isConnected && address && user && !user.wallet) {
      handleLinkWallet(address);
    }
  }, [isConnected, address, user]);

  const handleLinkWallet = async (walletAddress: string) => {
    setLoading(true);

    try {
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
          wallet: walletAddress,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local storage
        const updatedUser = { ...user, wallet: walletAddress };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        alert('✅ Wallet connected successfully!');
        router.push('/dashboard');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to link wallet');
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
            <p className="text-sm text-gray-400">
              Click the "Connect Wallet" button in the top right corner to link your MetaMask wallet.
            </p>

            {loading && (
              <div className="text-center py-4">
                <div className="text-lg">Linking wallet...</div>
              </div>
            )}

            {isConnected && address && (
              <div className="p-4 bg-green-900/30 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-200">
                  <strong>Wallet Connected:</strong>
                </p>
                <p className="text-xs text-green-100 mt-1 font-mono">
                  {address}
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
