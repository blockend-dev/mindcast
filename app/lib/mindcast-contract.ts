import { createPublicClient, createWalletClient, custom, http, parseEther } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import {MindCastRegistryABI}  from '../abis/MindCastRegistry'


export class MindCastContract {
  private contractAddress: `0x${string}`
  private publicClient: any
  private walletClient: any

  constructor() {
    this.contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`
    
    this.publicClient = createPublicClient({
      chain: sepolia, // or your 0G chain configuration
      transport: http(process.env.NEXT_PUBLIC_RPC_URL)
    })

    // Wallet client will be initialized with user's wallet
  }

  setWalletClient(provider: any) {
    this.walletClient = createWalletClient({
      chain: sepolia,
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