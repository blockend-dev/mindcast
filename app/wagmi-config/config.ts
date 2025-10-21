import { getDefaultConfig } from '@rainbow-me/rainbowkit';

const testnet = {
    id: 16602,
    name: 'OG-Testnet-Galileo',
    network: 'og-chain',
    nativeCurrency: {
        decimals: 18,
        name: 'OG',
        symbol: 'OG',
    },
    rpcUrls: {
        public: { http: [process.env.NEXT_PUBLIC_RPC_URL!] },
        default: { http: [process.env.NEXT_PUBLIC_RPC_URL!] },
    },
} as const;

export const config = getDefaultConfig({
  appName: 'Mindcast',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!, 
  chains: [testnet],
  ssr: true, 
});


declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}