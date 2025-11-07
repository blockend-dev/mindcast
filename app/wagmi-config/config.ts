import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';

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

const mainnet = {
    id: 16661,
    name: '0G Mainnet',
    network: 'og-chain',
    nativeCurrency: {
        decimals: 18,
        name: 'OG',
        symbol: 'OG',
    },
    rpcUrls: {
        public: { http: ['https://evmrpc.0g.ai'] },
        default: { http: ['https://evmrpc.0g.ai'] },
    },
} as const;

export const config = getDefaultConfig({
  appName: 'Mindcast',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!, 
  chains: [testnet,mainnet],
  transports :{
    [testnet.id] :http('https://evmrpc-testnet.0g.ai'),
    [mainnet.id] :http('https://evmrpc.0g.ai'),
  },
  ssr: true, 
});


declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}