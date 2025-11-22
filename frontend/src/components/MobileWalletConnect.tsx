'use client';

import { useState } from 'react';

interface MobileWalletConnectProps {
  onSuccess?: (address: string) => void;
  onError?: (error: string) => void;
}

export function MobileWalletConnect({ onSuccess, onError }: MobileWalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const openWalletApp = (walletType: 'metamask' | 'trust' | 'rainbow') => {
    setIsConnecting(true);
    
    const currentUrl = encodeURIComponent(window.location.href);
    const host = window.location.host;
    const path = window.location.pathname;
    
    let deepLink = '';
    
    switch (walletType) {
      case 'metamask':
        // MetaMask deep link
        deepLink = `https://metamask.app.link/dapp/${host}${path}`;
        break;
      case 'trust':
        // Trust Wallet deep link
        deepLink = `https://link.trustwallet.com/open_url?coin_id=60&url=https://${host}${path}`;
        break;
      case 'rainbow':
        // Rainbow Wallet deep link
        deepLink = `https://rnbwapp.com/wc?uri=https://${host}${path}`;
        break;
    }
    
    // Try to open the wallet app
    window.location.href = deepLink;
    
    // Set a timeout to check if the app opened
    setTimeout(() => {
      setIsConnecting(false);
      // If still on the page, show a message
      if (document.hasFocus()) {
        onError?.('Wallet app not found. Please install the wallet app first.');
      }
    }, 3000);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-gray-400 text-sm">
          Choose your wallet app to connect
        </p>
      </div>

      {/* MetaMask */}
      <button
        onClick={() => openWalletApp('metamask')}
        disabled={isConnecting}
        className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-bold py-4 px-6 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        <span className="text-2xl">🦊</span>
        <div className="text-left">
          <div className="font-bold">MetaMask</div>
          <div className="text-xs opacity-80">Most popular wallet</div>
        </div>
      </button>

      {/* Trust Wallet */}
      <button
        onClick={() => openWalletApp('trust')}
        disabled={isConnecting}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        <span className="text-2xl">🛡️</span>
        <div className="text-left">
          <div className="font-bold">Trust Wallet</div>
          <div className="text-xs opacity-80">Secure & easy to use</div>
        </div>
      </button>

      {/* Rainbow */}
      <button
        onClick={() => openWalletApp('rainbow')}
        disabled={isConnecting}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        <span className="text-2xl">🌈</span>
        <div className="text-left">
          <div className="font-bold">Rainbow</div>
          <div className="text-xs opacity-80">Beautiful interface</div>
        </div>
      </button>

      {isConnecting && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-400 text-sm mt-2">Opening wallet app...</p>
        </div>
      )}

      <div className="text-center pt-4">
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
