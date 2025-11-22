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

  // Helper function to send logs to backend
  const sendLogToBackend = async (message: string, data?: any) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://goalcoin.onrender.com';
      await fetch(`${backendUrl}/api/debug/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'MobileWalletConnect',
          message,
          data,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {}); // Ignore errors
    } catch (e) {}
  };

  const handleConnect = async () => {
    await sendLogToBackend('🔵 Button clicked!');
    await sendLogToBackend('🔵 Available connectors', { connectors: connectors.map(c => c.name) });
    
    setIsConnecting(true);
    
    try {
      // Find WalletConnect connector
      const walletConnectConnector = connectors.find((c) => c.name === 'WalletConnect');
      
      await sendLogToBackend('🔵 WalletConnect connector found', { found: !!walletConnectConnector });
      
      if (walletConnectConnector) {
        await sendLogToBackend('🔵 Attempting to connect...');
        
        // This will open the WalletConnect modal with QR code
        await connect({ connector: walletConnectConnector });
        
        await sendLogToBackend('✅ Connect function called successfully');
      } else {
        const errorMsg = 'WalletConnect not available. Please refresh the page.';
        await sendLogToBackend('❌ WalletConnect not available', { allConnectors: connectors.map(c => c.name) });
        onError?.(errorMsg);
      }
    } catch (error: any) {
      await sendLogToBackend('❌ Error occurred', {
        message: error?.message,
        name: error?.name,
        code: error?.code,
      });
      
      // Handle specific error cases
      if (error?.message?.includes('Connection request reset')) {
        onError?.('Connection cancelled. Please try again.');
      } else if (error?.message?.includes('User rejected')) {
        onError?.('Connection rejected. Please approve in your wallet.');
      } else {
        onError?.('Failed to connect. Please try again.');
      }
    } finally {
      await sendLogToBackend('🔵 Setting isConnecting to false');
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-gray-400 text-sm mb-2">
          Connect your MetaMask wallet
        </p>
        <p className="text-gray-500 text-xs">
          Scan QR code with MetaMask mobile app
        </p>
      </div>

      {/* MetaMask Connect Button */}
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-bold py-4 px-6 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg"
      >
        <span className="text-2xl">🦊</span>
        <div className="text-center">
          <div className="font-bold text-lg">Connect MetaMask</div>
          <div className="text-xs opacity-90">Scan QR code to connect</div>
        </div>
      </button>

      {isConnecting && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-400 text-sm mt-2">Opening connection modal...</p>
        </div>
      )}

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-blue-400 text-sm font-medium mb-2">📲 How to connect MetaMask:</p>
        <ol className="text-gray-300 text-xs space-y-1 list-decimal list-inside">
          <li>Click "Connect MetaMask" button above</li>
          <li>A QR code modal will appear</li>
          <li>Open MetaMask app on your phone</li>
          <li>Tap the scan icon (📷) in MetaMask</li>
          <li>Scan the QR code on this screen</li>
          <li>Approve the connection in MetaMask</li>
          <li>You'll be returned to this page automatically</li>
        </ol>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
        <p className="text-yellow-400 text-xs">
          💡 <strong>Important:</strong> After approving in MetaMask, wait a few seconds. 
          Your wallet address will appear on this page automatically.
        </p>
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
