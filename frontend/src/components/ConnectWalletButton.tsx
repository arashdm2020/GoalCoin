'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useEffect, useState } from 'react';

/**
 * ConnectWalletButton component
 * Handles wallet connection and automatically sends connection to backend
 */
export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);

  // Check for MetaMask and client-side rendering
  useEffect(() => {
    setIsClient(true);
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
      setIsMetaMaskInstalled(true);
    }
  }, []);

  // Send connection to backend when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      sendConnectionToBackend(address);
    }
  }, [isConnected, address]);

  const sendConnectionToBackend = async (walletAddress: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://localhost:3001';
      const response = await fetch(`${backendUrl}/api/users/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: walletAddress }),
      });

      if (!response.ok) {
        console.error('Failed to register connection with backend');
      }
    } catch (error) {
      console.error('Error connecting to backend:', error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Use the first available connector (MetaMask or Injected)
      const connector = connectors.find((c) => c.name === 'MetaMask') || connectors[0];
      if (connector) {
        connect({ connector });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Show placeholder during SSR to prevent hydration mismatch
  if (!isClient) {
    return (
      <button
        disabled
        className="px-6 py-2 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold rounded-lg opacity-50"
      >
        Connect Wallet
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button
        onClick={handleDisconnect}
        className="px-6 py-2 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
      >
        {shortenAddress(address)}
      </button>
    );
  }

  if (!isMetaMaskInstalled) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
      >
        Install MetaMask
      </a>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="px-6 py-2 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
