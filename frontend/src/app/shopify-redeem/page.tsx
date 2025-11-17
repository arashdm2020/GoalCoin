'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShopifyRedeemPage() {
  const [orderCode, setOrderCode] = useState('');
  const [wallet, setWallet] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.wallet) {
      setWallet(user.wallet);
    }
  }, [router]);

  const handleVerify = async () => {
    if (!orderCode) {
      setMessage('Please enter an order code');
      setIsValid(false);
      return;
    }

    setVerifying(true);
    setIsValid(null);
    setMessage('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const response = await fetch(`${backendUrl}/api/shopify/verify/${orderCode}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify code');
      }
      
      const data = await response.json();

      if (data.valid && !data.redeemed) {
        setIsValid(true);
        setMessage('✅ Order code is valid and available');
      } else if (data.redeemed) {
        setIsValid(false);
        setMessage('❌ This code has already been redeemed');
      } else {
        setIsValid(false);
        setMessage('❌ Invalid order code');
      }
    } catch (error: any) {
      setMessage(`❌ ${error.message || 'Error verifying code. Please try again.'}`);
      setIsValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleRedeem = async () => {
    setRedeeming(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      if (!user.id && !wallet) {
        setMessage('❌ Please login or provide a wallet address');
        setRedeeming(false);
        return;
      }

      const response = await fetch(`${backendUrl}/api/shopify/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_code: orderCode,
          user_id: user.id,
          wallet: wallet || user.wallet,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Order code redeemed successfully! Redirecting...');
        setIsValid(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        throw new Error(data.error || 'Failed to redeem code');
      }
    } catch (error: any) {
      setMessage(`❌ ${error.message || 'Failed to redeem code. Please try again.'}`);
      setIsValid(false);
    } finally {
      setRedeeming(false);
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
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">🎁 Redeem Shopify Code</h1>
            <p className="text-gray-400 text-lg">
              Enter your order code to unlock the challenge
            </p>
          </div>

          <div className="bg-gray-900 border border-[#FFD700]/20 rounded-lg p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Shopify Order Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                    placeholder="SHOP-12345"
                  />
                  <button
                    onClick={handleVerify}
                    disabled={verifying || !orderCode}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {verifying ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>

              {message && (
                <div
                  className={`p-4 rounded-lg border ${
                    isValid
                      ? 'bg-green-900/30 border-green-500/30 text-green-200'
                      : 'bg-red-900/30 border-red-500/30 text-red-200'
                  }`}
                >
                  <p className="text-sm">{message}</p>
                </div>
              )}

              {isValid && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Wallet Address
                    </label>
                    <input
                      type="text"
                      value={wallet}
                      onChange={(e) => setWallet(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
                      placeholder="0x..."
                    />
                  </div>

                  <button
                    onClick={handleRedeem}
                    disabled={redeeming || !wallet}
                    className="w-full py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {redeeming ? 'Redeeming...' : 'Redeem Code & Join Challenge'}
                  </button>
                </>
              )}

              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-200">
                  💡 <strong>How it works:</strong>
                </p>
                <ul className="text-xs text-blue-100 mt-2 space-y-1">
                  <li>• Purchase merchandise from our Shopify store</li>
                  <li>• Receive an order code via email</li>
                  <li>• Enter the code here to unlock the 90-Day Challenge</li>
                  <li>• No additional crypto payment required!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
