'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { polygonMumbai } from 'wagmi/chains';
import { injected, walletConnect } from '@wagmi/connectors';

const queryClient = new QueryClient();

// WalletConnect project ID - get from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

// Build connectors array - supports both desktop (injected) and mobile (WalletConnect)
const baseConnectors = [
  injected(), // MetaMask extension for desktop
  walletConnect({ 
    projectId,
    metadata: {
      name: 'GoalCoin',
      description: 'Sports-Driven Web3 Fitness Platform',
      url: 'https://goal-coin.vercel.app',
      icons: ['https://goal-coin.vercel.app/favicon.ico']
    },
    showQrModal: true // Shows QR code modal for mobile wallet connection
  })
];

const config = createConfig({
  chains: [polygonMumbai],
  connectors: baseConnectors,
  transports: {
    [polygonMumbai.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
