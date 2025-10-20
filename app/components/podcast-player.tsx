'use client'

import { useState, useRef } from 'react'
import { Play, Pause, Volume2, Heart, Share2 } from 'lucide-react'
import { Button } from './ui/button'

interface PodcastPlayerProps {
  episode: {
    title: string
    audioURI: string
    summary: string
    creator: string
    timestamp: number
  }
}

export function PodcastPlayer({ episode }: PodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      setDuration(audioRef.current.duration || 0)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
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
          
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Button
                variant="premium"
                size="icon"
                onClick={togglePlay}
                className="rounded-full w-12 h-12"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              
              <div className="flex-grow">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-blue-500 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
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
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
              
              <div className="text-xs text-gray-500">
                Created by {episode.creator.slice(0, 8)}...{episode.creator.slice(-6)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <audio
        ref={audioRef}
        src={episode.audioURI}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  )
}