'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, Heart, Share2, Gift, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { useMindCastContract } from '@/app/hooks/useMindCastContract'
import { formatAddress, formatTimestamp } from '@/app/lib/utils'
import { toast } from 'react-hot-toast';


interface PodcastPlayerProps {
  episode: {
    id: number
    creator: string
    title: string
    audioURI: string
    transcriptURI: string
    summary: string
    tags: string
    timestamp: number
    tipAmount: bigint
  }
}

export function PodcastPlayer({ episode }: PodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showTipModal, setShowTipModal] = useState(false)
  const [tipAmount, setTipAmount] = useState('0.001')
  const [isTipping, setIsTipping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const { useTipCreator, address, isConnected } = useMindCastContract()
  const tipMutation = useTipCreator()

  // Generate audio URL from rootHash
  const getAudioUrl = (rootHash: string) => {
    return `/api/download/${rootHash}`
  }

  // Initialize audio when episode changes
  useEffect(() => {
    if (episode.audioURI && audioRef.current) {
      const url = getAudioUrl(episode.audioURI)
      console.log('Setting audio URL:', url)

      // Reset states
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)

      // Set audio source
      audioRef.current.src = url
      audioRef.current.load()
    }
  }, [episode.audioURI])

  const togglePlay = async () => {
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        // Ensure audio is loaded
        if (audioRef.current.readyState < 1) { // HAVE_NOTHING
          setIsLoading(true)
          audioRef.current.load()
        }

        await audioRef.current.play()
        setIsPlaying(true)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error playing audio:', error)
      setIsPlaying(false)
      setIsLoading(false)
      toast.error('Failed to play audio. Please try again.')
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      const newDuration = audioRef.current.duration
      // Handle NaN explicitly
      setDuration(isNaN(newDuration) ? 0 : newDuration)
    }
  }

  const formatTime = (seconds: number) => {
    // Handle NaN, Infinity, or negative values
    if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
      return "0:00"
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const newDuration = audioRef.current.duration
      setDuration(isNaN(newDuration) ? 0 : newDuration)
      setIsLoading(false)
    }
  }

  const handleTip = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to send a tip')
      return
    }

    try {
      setIsTipping(true)
      await tipMutation.mutateAsync({
        episodeId: episode.id,
        amount: tipAmount
      })

      setShowTipModal(false)
      setTipAmount('0.001')
      toast.success(`Successfully tipped ${tipAmount} ETH to the creator!`)
    } catch (error) {
      console.error('Tip failed:', error)
      toast.error('Failed to send tip. Please try again.')
    } finally {
      setIsTipping(false)
    }
  }

  const formatTipAmount = (amount: bigint) => {
    const eth = Number(amount) / 1e18
    return eth.toFixed(4)
  }

  const handleViewTranscript = async () => {
    try {
      const response = await fetch(`/api/download/${episode.transcriptURI}`)
      if (response.ok) {
        const transcriptData = await response.json()
        toast.success(`Transcript: ${transcriptData.transcript || 'No transcript available'}`)
      } else {
        toast.error('Failed to fetch transcript')
      }
    } catch (error) {
      console.error('Error fetching transcript:', error)
      toast.error('Failed to fetch transcript')

    }
  }

  return (
    <>
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-gray-800">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-500 rounded-xl flex items-center justify-center">
              <Volume2 className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="flex-grow">
            <h3 className="text-xl font-semibold text-white mb-2">{episode.title}</h3>
            <p className="text-gray-400 text-sm mb-4">{episode.summary}</p>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span>By {formatAddress(episode.creator)}</span>
              <span>•</span>
              <span>{formatTimestamp(Number(episode.timestamp) * 1000)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Gift className="w-4 h-4" />
                {formatTipAmount(episode.tipAmount)} ETH
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Button
                  variant="premium"
                  size="icon"
                  onClick={togglePlay}
                  disabled={isLoading}
                  className="rounded-full w-12 h-12"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>

                <div className="flex-grow">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-blue-500 h-2 rounded-full transition-all duration-200"
                      style={{
                        width: duration > 0
                          ? `${(currentTime / duration) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Heart className="w-4 h-4 mr-2" />
                    Like
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-400 hover:text-blue-300"
                    onClick={handleViewTranscript}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Transcript
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-400 hover:text-green-300"
                    onClick={() => setShowTipModal(true)}
                    disabled={episode.creator.toLowerCase() === address?.toLowerCase()}
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Tip Creator
                  </Button>
                </div>

                <div className="text-xs text-gray-500">
                  Episode #{episode.id}
                </div>
              </div>

              {episode.tags && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {episode.tags.split(',').map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded-full text-xs"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <audio
          ref={audioRef}
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onError={(e) => {
            console.error('Audio loading error:', e)
            setIsLoading(false)
            toast.error('Failed to load audio. Please try again.')
          }}
        />
      </div>

      {/* Tip Modal remains the same */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Tip the Creator</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (ETH)
                </label>
                <input
                  type="text"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  placeholder="0.001"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-2">
                {['0.001', '0.005', '0.01'].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setTipAmount(amount)}
                    className={`flex-1 ${tipAmount === amount
                        ? 'border-purple-500 text-purple-500'
                        : 'border-gray-700 text-gray-400'
                      }`}
                  >
                    {amount} ETH
                  </Button>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowTipModal(false)}
                  className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  variant="premium"
                  onClick={handleTip}
                  disabled={isTipping || !tipAmount}
                  className="flex-1"
                >
                  {isTipping ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Tipping...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Send Tip
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}