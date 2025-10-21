'use client'

import { useState, useRef } from 'react'
import { useMindCastContract } from '@/app/hooks/useMindCastContract'
import { Button } from './ui/button'
import { Mic, Square, Upload, Loader2, CheckCircle, ExternalLink } from 'lucide-react'

type UploadState = 'idle' | 'uploading' | 'processing' | 'publishing' | 'success' | 'error'

export function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [episodeTitle, setEpisodeTitle] = useState('')
  const [episodeTags, setEpisodeTags] = useState('')
  const [uploadResult, setUploadResult] = useState<{ rootHash: string; transactionHash: string } | null>(null)
  const [publishResult, setPublishResult] = useState<{ txHash: string } | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const { useCreateEpisode, isConnected, address } = useMindCastContract()
  const createEpisodeMutation = useCreateEpisode()

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm;codecs=opus'
        })
        setAudioBlob(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Failed to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const handlePublish = async () => {
    if (!audioBlob || !episodeTitle || !isConnected) return

    try {
      setUploadState('uploading')

      // Step 1: Upload audio to 0G Storage
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const uploadResult = await uploadResponse.json()
      setUploadResult(uploadResult)
      const audioCid = uploadResult.rootHash

      setUploadState('processing')

      // Step 2: AI Processing (Transcription & Summary)
      const inferenceResponse = await fetch('/api/inference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioCid })
      })

      if (!inferenceResponse.ok) {
        const errorData = await inferenceResponse.json()
        throw new Error(errorData.error || 'AI processing failed')
      }

      const inferenceResult = await inferenceResponse.json()
      const { transcriptCid, summary, topics } = inferenceResult

      setUploadState('publishing')

      // Step 3: Publish to Blockchain using contract
      const txHash = await createEpisodeMutation.mutateAsync({
        title: episodeTitle,
        audioURI: `ipfs://${audioCid}`,
        transcriptURI: `ipfs://${transcriptCid}`,
        summary: summary,
        tags: episodeTags || topics
      })

      setPublishResult({ txHash })
      setUploadState('success')

      // Reset form after successful publish
      setTimeout(() => {
        setUploadState('idle')
        setAudioBlob(null)
        setEpisodeTitle('')
        setEpisodeTags('')
        setUploadResult(null)
        setPublishResult(null)
      }, 5000)

    } catch (error) {
      console.error('Publish error:', error)
      setUploadState('error')
    }
  }

  const getButtonState = () => {
    switch (uploadState) {
      case 'uploading':
        return {
          variant: 'secondary' as const,
          text: 'Uploading to 0G...',
          icon: <Loader2 className="w-4 h-4 animate-spin" />
        }
      case 'processing':
        return {
          variant: 'secondary' as const,
          text: 'AI Processing...',
          icon: <Loader2 className="w-4 h-4 animate-spin" />
        }
      case 'publishing':
        return {
          variant: 'secondary' as const,
          text: 'Publishing to Blockchain...',
          icon: <Loader2 className="w-4 h-4 animate-spin" />
        }
      case 'success':
        return {
          variant: 'premium' as const,
          text: 'Published Successfully!',
          icon: <CheckCircle className="w-4 h-4" />
        }
      case 'error':
        return {
          variant: 'destructive' as const,
          text: 'Publish Failed - Try Again',
          icon: <Upload className="w-4 h-4" />
        }
      default:
        return {
          variant: 'premium' as const,
          text: 'Publish to MindCast',
          icon: <Upload className="w-4 h-4" />
        }
    }
  }

  const buttonState = getButtonState()

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Create Podcast Episode</h3>
        <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' :
            uploadState !== 'idle' ? 'bg-blue-500' : 'bg-gray-600'
          }`} />
      </div>

      <div className="space-y-4">
        {/* Recording Controls */}
        <div className="flex gap-3">
          <Button
            variant={isRecording ? "destructive" : "premium"}
            onClick={isRecording ? stopRecording : startRecording}
            className="flex items-center gap-2"
            disabled={uploadState !== 'idle'}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
        </div>

        {/* Audio Preview */}
        {audioBlob && (
          <div className="space-y-4">
            <audio
              controls
              src={URL.createObjectURL(audioBlob)}
              className="w-full rounded-lg"
            />

            {/* Upload Result */}
            {uploadResult && (
              <div className="bg-gray-800 rounded-lg p-3 text-sm">
                <div className="text-green-400 font-medium">0G Upload Successful</div>
                <div className="text-gray-400 text-xs break-all mt-1">
                  Root Hash: {uploadResult.rootHash}
                </div>
                <div className="text-gray-400 text-xs break-all">
                  TX: {uploadResult.transactionHash}
                </div>
              </div>
            )}

            {/* Publish Result */}
            {publishResult && (
              <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 text-sm">
                <div className="text-green-400 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Published to Blockchain!
                </div>
                <div className="text-gray-300 text-xs break-all mt-1">
                  Transaction: {publishResult.txHash}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-green-400 hover:text-green-300"
                  onClick={() => window.open(`https://evm-testnet.0g.ai/tx/${publishResult.txHash}`, '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View on Explorer
                </Button>
              </div>
            )}

            {/* Episode Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Episode Title *
                </label>
                <input
                  type="text"
                  value={episodeTitle}
                  onChange={(e) => setEpisodeTitle(e.target.value)}
                  placeholder="Enter episode title..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={episodeTags}
                  onChange={(e) => setEpisodeTags(e.target.value)}
                  placeholder="web3, podcast, ai..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <Button
                variant={buttonState.variant}
                onClick={handlePublish}
                disabled={!episodeTitle || !isConnected || uploadState !== 'idle'}
                className="w-full flex items-center gap-2"
              >
                {buttonState.icon}
                {buttonState.text}
              </Button>

              {!isConnected && (
                <p className="text-sm text-yellow-500 text-center">
                  Please connect your wallet to publish
                </p>
              )}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploadState !== 'idle' && uploadState !== 'success' && uploadState !== 'error' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Publishing Progress</span>
              <span className="capitalize">{uploadState}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width:
                    uploadState === 'uploading' ? '33%' :
                      uploadState === 'processing' ? '66%' :
                        uploadState === 'publishing' ? '100%' : '0%'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}