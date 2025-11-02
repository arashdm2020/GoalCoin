'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { polygonMumbai } from 'wagmi/chains';
import { injected } from '@wagmi/core';

const queryClient = new QueryClient();

// Build connectors array - injected() handles MetaMask and other injected wallets automatically
const baseConnectors = [injected()];

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
