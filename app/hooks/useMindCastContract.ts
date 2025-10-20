'use client'

import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { useState, useEffect, useCallback } from 'react'
import { mindCastContract } from '@/app/lib/mindcast-contract'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useMindCastContract() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()

  // Set wallet client when connected
  useEffect(() => {
    if (walletClient && isConnected) {
      mindCastContract.setWalletClient(walletClient)
    }
  }, [walletClient, isConnected])

  // Get all episodes
  const useEpisodes = () => {
    return useQuery({
      queryKey: ['episodes'],
      queryFn: async () => {
        const totalEpisodes = await mindCastContract.getTotalEpisodes()
        const episodes = []
        
        for (let i = 0; i < Number(totalEpisodes); i++) {
          try {
            const episode = await mindCastContract.getEpisode(i)
            episodes.push({
              id: i,
              ...episode
            })
          } catch (error) {
            console.error(`Error fetching episode ${i}:`, error)
          }
        }
        
        return episodes.reverse() // Latest 
      },
      enabled: !!publicClient,
    })
  }

  // Get episodes by creator
  const useCreatorEpisodes = (creatorAddress?: string) => {
    return useQuery({
      queryKey: ['creator-episodes', creatorAddress],
      queryFn: async () => {
        if (!creatorAddress) return []
        
        const episodeIds = await mindCastContract.getEpisodesByCreator(creatorAddress)
        const episodes = []
        
        for (const episodeId of episodeIds) {
          try {
            const episode = await mindCastContract.getEpisode(Number(episodeId))
            episodes.push({
              id: Number(episodeId),
              ...episode
            })
          } catch (error) {
            console.error(`Error fetching episode ${episodeId}:`, error)
          }
        }
        
        return episodes.reverse() // Latest first
      },
      enabled: !!publicClient && !!creatorAddress,
    })
  }

  // Create episode mutation
  const useCreateEpisode = () => {
    return useMutation({
      mutationFn: async (episodeData: {
        title: string
        audioURI: string
        transcriptURI: string
        summary: string
        tags: string
      }) => {
        if (!walletClient) {
          throw new Error('Wallet not connected')
        }

        mindCastContract.setWalletClient(walletClient)
        
        const txHash = await mindCastContract.createEpisode(
          episodeData.title,
          episodeData.audioURI,
          episodeData.transcriptURI,
          episodeData.summary,
          episodeData.tags
        )

        return txHash
      },
      onSuccess: () => {
        // Invalidate episodes queries
        queryClient.invalidateQueries({ queryKey: ['episodes'] })
        queryClient.invalidateQueries({ queryKey: ['creator-episodes'] })
      },
    })
  }

  // Tip creator mutation
  const useTipCreator = () => {
    return useMutation({
      mutationFn: async (tipData: {
        episodeId: number
        amount: string
      }) => {
        if (!walletClient) {
          throw new Error('Wallet not connected')
        }

        mindCastContract.setWalletClient(walletClient)
        
        const txHash = await mindCastContract.tipCreator(
          tipData.episodeId,
          tipData.amount
        )

        return txHash
      },
      onSuccess: () => {
        // Invalidate episodes queries to reflect updated tip amounts
        queryClient.invalidateQueries({ queryKey: ['episodes'] })
      },
    })
  }

  // Watch for new episodes
  const useNewEpisodes = (onNewEpisode?: (episode: any) => void) => {
    useEffect(() => {
      if (!publicClient || !onNewEpisode) return

      const unwatch = mindCastContract.watchNewEpisodes(onNewEpisode)

      return () => {
        unwatch.then(unwatchFn => unwatchFn())
      }
    }, [publicClient, onNewEpisode])
  }

  return {
    useEpisodes,
    useCreatorEpisodes,
    useCreateEpisode,
    useTipCreator,
    useNewEpisodes,
    isConnected,
    address
  }
}