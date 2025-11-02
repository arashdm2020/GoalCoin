// This file extends the global Window interface to include the Ethereum provider
// injected by MetaMask and other wallets.

interface Window {
  ethereum?: {
    isMetaMask?: true;
    request?: (...args: any[]) => Promise<void>;
  };
}
