'use client'

import { useMindCastContract } from '@/app/hooks/useMindCastContract'
import { PodcastPlayer } from './podcast-player'
import { Button } from './ui/button'
import { Loader2, RefreshCw } from 'lucide-react'

export function EpisodesFeed() {
  const { useEpisodes, useNewEpisodes } = useMindCastContract()
  const { data: episodes, isLoading, error, refetch } = useEpisodes()

  // Listen for new episodes
  useNewEpisodes((newEpisode) => {
    console.log('New episode created:', newEpisode)
    refetch() // Refresh the list when new episode is detected
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-2 text-gray-400">Loading episodes...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">Failed to load episodes</div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  if (!episodes || episodes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">No episodes yet</div>
        <div className="text-sm text-gray-500">Be the first to create a podcast episode!</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Latest Episodes</h2>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-gray-400">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        {episodes.map((episode) => (
          <PodcastPlayer key={episode.id} episode={episode} />
        ))}
      </div>
    </div>
  )
}