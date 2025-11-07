import { createPublicClient, createWalletClient, custom, http, parseEther } from 'viem'
import {MindCastRegistryABI}  from '../abis/MindCastRegistry'

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

export class MindCastContract {
  private contractAddress: `0x${string}`
  private publicClient: any
  private walletClient: any

  constructor() {
    this.contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`
    
    this.publicClient = createPublicClient({
      chain: mainnet,
      transport: http('https://evmrpc.0g.ai')
    })
  }

  setWalletClient(provider: any) {
    this.walletClient = createWalletClient({
      chain: mainnet,
      transport: custom(provider)
    })
  }

  async createEpisode(
    title: string,
    audioURI: string,
    transcriptURI: string,
    summary: string,
    tags: string
  ): Promise<`0x${string}`> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    const [address] = await this.walletClient.getAddresses()
    
    const { request } = await this.publicClient.simulateContract({
      address: this.contractAddress,
      abi: MindCastRegistryABI,
      functionName: 'createEpisode',
      args: [title, audioURI, transcriptURI, summary, tags],
      account: address,
    })

    const hash = await this.walletClient.writeContract(request)
    return hash
  }

  async tipCreator(episodeId: number, amount: string): Promise<`0x${string}`> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    const [address] = await this.walletClient.getAddresses()
    
    const { request } = await this.publicClient.simulateContract({
      address: this.contractAddress,
      abi: MindCastRegistryABI,
      functionName: 'tipCreator',
      args: [BigInt(episodeId)],
      value: parseEther(amount),
      account: address,
    })

    const hash = await this.walletClient.writeContract(request)
    return hash
  }

  async getEpisode(episodeId: number): Promise<any> {
    return await this.publicClient.readContract({
      address: this.contractAddress,
      abi: MindCastRegistryABI,
      functionName: 'getEpisode',
      args: [BigInt(episodeId)],
    })
  }

  async getEpisodesByCreator(creatorAddress: string): Promise<bigint[]> {
    return await this.publicClient.readContract({
      address: this.contractAddress,
      abi: MindCastRegistryABI,
      functionName: 'getEpisodesByCreator',
      args: [creatorAddress as `0x${string}`],
    })
  }

  async getTotalEpisodes(): Promise<bigint> {
    return await this.publicClient.readContract({
      address: this.contractAddress,
      abi: MindCastRegistryABI,
      functionName: 'getTotalEpisodes',
    })
  }

  // Listen for new episodes
  async watchNewEpisodes(callback: (episode: any) => void) {
    return this.publicClient.watchContractEvent({
      address: this.contractAddress,
      abi: MindCastRegistryABI,
      eventName: 'EpisodeCreated',
      onLogs: (logs: any[]) => {
        logs.forEach(log => {
          callback({
            episodeId: Number(log.args.episodeId),
            creator: log.args.creator,
            title: log.args.title,
            timestamp: Number(log.args.timestamp)
          })
        })
      },
    })
  }
}

export const mindCastContract = new MindCastContract()