'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { useToast } from '../../hooks/useToastNotification';
import ConfirmDialog from '../../components/ConfirmDialog';
import { ConnectWalletButton } from '../../components/ConnectWalletButton';

interface User {
  id: string;
  email?: string;
  wallet?: string;
  handle?: string;
  created_at?: string;
}

interface WalletConnection {
  wallet_address: string;
  connected_at: string;
  network: string;
  last_activity?: string;
}

export default function WalletSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletHistory, setWalletHistory] = useState<WalletConnection[]>([]);
  const router = useRouter();
  const { showSuccess, showError, ToastComponent } = useToast();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    const fetchUser = async () => {
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

        if (!response.ok) {
          throw new Error('Unauthorized');
        }

        const data = await response.json();
        setUser(data.user);
        
        // Mock wallet history - in production, fetch from backend
        if (data.user.wallet) {
          setWalletHistory([
            {
              wallet_address: data.user.wallet,
              connected_at: data.user.created_at || new Date().toISOString(),
              network: 'Polygon',
              last_activity: new Date().toISOString(),
            }
          ]);
        }
      } catch (error) {
        localStorage.removeItem('auth_token');
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleDisconnect = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';

      // Disconnect from wagmi
      disconnect();

      // Notify backend
      await fetch(`${backendUrl}/api/users/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ wallet: user?.wallet }),
      });

      showSuccess('Wallet disconnected successfully');
      
      // Refresh user data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      showError('Failed to disconnect wallet');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Address copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-gray-800/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold">Wallet Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Current Wallet Status */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Current Wallet</h2>
              {user.wallet && (
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  ✓ Connected
                </span>
              )}
            </div>

            {user.wallet ? (
              <div className="space-y-4">
                {/* Wallet Address */}
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Wallet Address</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-white font-mono text-sm sm:text-base break-all">
                      {user.wallet}
                    </code>
                    <button
                      onClick={() => copyToClipboard(user.wallet!)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                      title="Copy full address"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Network Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Network</label>
                    <p className="text-white font-semibold">Polygon Mainnet</p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Connected Since</label>
                    <p className="text-white font-semibold">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => router.push('/link-wallet')}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium"
                  >
                    Change Wallet
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Disconnect Wallet',
                        message: 'Are you sure you want to disconnect your wallet? You will need to reconnect it to access Web3 features.',
                        onConfirm: handleDisconnect,
                      });
                    }}
                    className="flex-1 px-4 py-3 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-lg transition-colors font-medium"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p className="text-gray-400 mb-4">No wallet connected</p>
                <p className="text-gray-500 text-sm mb-6">Connect your wallet to access Web3 features and payments</p>
                <ConnectWalletButton />
              </div>
            )}
          </div>

          {/* Wallet Connection History */}
          {walletHistory.length > 0 && (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 sm:p-6">
              <h2 className="text-xl font-bold text-white mb-6">Connection History</h2>
              <div className="space-y-3">
                {walletHistory.map((connection, index) => (
                  <div key={index} className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-white font-mono text-sm truncate">
                            {truncateAddress(connection.wallet_address)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(connection.wallet_address)}
                            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                          <span>Network: {connection.network}</span>
                          <span>Connected: {formatDate(connection.connected_at)}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium self-start sm:self-center">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important Information */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 sm:p-6">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <h3 className="text-blue-400 font-semibold mb-2">Important Information</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex gap-2">
                    <span className="text-blue-400 flex-shrink-0">•</span>
                    <span>Your wallet is used for Web3 payments and challenge participation</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 flex-shrink-0">•</span>
                    <span>We support Polygon network for low-fee USDT transactions</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 flex-shrink-0">•</span>
                    <span>On mobile, use WalletConnect or MetaMask app browser</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 flex-shrink-0">•</span>
                    <span>Never share your private keys or seed phrase with anyone</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </main>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        type="danger"
      />

      {ToastComponent}
    </div>
  );
}
