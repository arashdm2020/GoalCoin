'use client';

import { useState } from 'react';
import { useConnect } from 'wagmi';

interface MobileWalletConnectProps {
  onSuccess?: (address: string) => void;
  onError?: (error: string) => void;
}

export function MobileWalletConnect({ onSuccess, onError }: MobileWalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { connect, connectors } = useConnect();

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Find WalletConnect connector
      const walletConnectConnector = connectors.find((c) => c.name === 'WalletConnect');
      
      if (walletConnectConnector) {
        // This will open the WalletConnect modal with QR code
        // User can scan with any wallet app (MetaMask, Trust, Rainbow, etc.)
        connect({ connector: walletConnectConnector });
      } else {
        onError?.('WalletConnect not available. Please try again.');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      onError?.('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-gray-400 text-sm mb-2">
          Scan QR code with your wallet app
        </p>
        <p className="text-gray-500 text-xs">
          Works with MetaMask, Trust Wallet, Rainbow, and 200+ wallets
        </p>
      </div>

      {/* Single WalletConnect Button */}
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg"
      >
        <span className="text-2xl">�</span>
        <div className="text-center">
          <div className="font-bold text-lg">Connect Mobile Wallet</div>
          <div className="text-xs opacity-90">Scan QR code to connect</div>
        </div>
      </button>

      {isConnecting && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-400 text-sm mt-2">Opening connection modal...</p>
        </div>
      )}

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-blue-400 text-sm font-medium mb-2">📲 How to connect:</p>
        <ol className="text-gray-300 text-xs space-y-1 list-decimal list-inside">
          <li>Click the button above</li>
          <li>A QR code will appear</li>
          <li>Open your wallet app (MetaMask, Trust, etc.)</li>
          <li>Scan the QR code</li>
          <li>Approve the connection in your wallet</li>
        </ol>
      </div>

      <div className="text-center pt-2">
        <p className="text-gray-500 text-xs">
          Don't have a wallet?{' '}
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Download MetaMask
          </a>
        </p>
      </div>
    </div>
  );
}
