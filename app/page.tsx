'use client'

import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { AudioRecorder } from '@/app/components/audio-recorder'
import { EpisodesFeed } from '@/app/components/episodes-feed'
import { Button } from './components/ui/button'
import { Mic, Headphones, Zap } from 'lucide-react'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'listen' | 'create'>('listen')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                MindCast
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            Decentralized Podcasting
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Record, upload, and publish voice content that's analyzed, summarized, and stored entirely on-chain via the 0G stack.
          </p>
          
          <div className="flex gap-4 justify-center mb-16">
            <Button 
              variant="premium" 
              size="lg" 
              className="rounded-full px-8"
              onClick={() => setActiveTab('create')}
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full px-8 border-gray-700 text-white hover:bg-gray-800"
              onClick={() => setActiveTab('listen')}
            >
              <Headphones className="w-5 h-5 mr-2" />
              Explore Podcasts
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">128</div>
              <div className="text-gray-400">Episodes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">42</div>
              <div className="text-gray-400">Creators</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">1.2k</div>
              <div className="text-gray-400">Listeners</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 pb-16">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-900 rounded-2xl p-2 border border-gray-800">
            <Button
              variant={activeTab === 'listen' ? 'premium' : 'ghost'}
              onClick={() => setActiveTab('listen')}
              className="rounded-xl"
            >
              <Headphones className="w-4 h-4 mr-2" />
              Listen
            </Button>
            <Button
              variant={activeTab === 'create' ? 'premium' : 'ghost'}
              onClick={() => setActiveTab('create')}
              className="rounded-xl"
            >
              <Mic className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'listen' ? (
          <div className="max-w-4xl mx-auto">
            <EpisodesFeed />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <AudioRecorder />
            
            {/* Features */}
            <div className="grid grid-cols-3 gap-6 mt-12">
              <div className="text-center p-6 bg-gray-900 rounded-2xl border border-gray-800">
                <Zap className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">0G Storage</h3>
                <p className="text-sm text-gray-400">Fully decentralized storage for your audio content</p>
              </div>
              <div className="text-center p-6 bg-gray-900 rounded-2xl border border-gray-800">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">AI</span>
                </div>
                <h3 className="font-semibold text-white mb-2">AI Analysis</h3>
                <p className="text-sm text-gray-400">Automatic transcription and summarization</p>
              </div>
              <div className="text-center p-6 bg-gray-900 rounded-2xl border border-gray-800">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">$</span>
                </div>
                <h3 className="font-semibold text-white mb-2">Monetization</h3>
                <p className="text-sm text-gray-400">Earn through tips and tokenized access</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}