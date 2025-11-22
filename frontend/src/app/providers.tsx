'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { polygonMumbai } from 'wagmi/chains';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';

const queryClient = new QueryClient();

// WalletConnect project ID - get from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'c7fcdfa01ace740d702c0028052800af';

// Metadata for Web3Modal
const metadata = {
  name: 'GoalCoin',
  description: 'Sports-Driven Web3 Fitness Platform',
  url: 'https://goal-coin.vercel.app',
  icons: ['https://goal-coin.vercel.app/favicon.ico']
};

// Create wagmi config with Web3Modal
const config = defaultWagmiConfig({
  chains: [polygonMumbai],
  projectId,
  metadata,
});

// Create Web3Modal instance
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-z-index': 9999,
    '--w3m-accent': '#ff6b35',
  }
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
