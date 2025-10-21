'use client'

import { useState, useRef, useEffect } from 'react'
import { useMindCastContract } from '@/app/hooks/useMindCastContract'
import { Button } from './ui/button'
import { Mic, Square, Upload, Loader2, CheckCircle, ExternalLink, Volume2 } from 'lucide-react'

type UploadState = 'idle' | 'uploading' | 'processing' | 'publishing' | 'success' | 'error'

export function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [episodeTitle, setEpisodeTitle] = useState('')
  const [episodeTags, setEpisodeTags] = useState('')
  const [uploadResult, setUploadResult] = useState<{ rootHash: string; transactionHash: string } | null>(null)
  const [publishResult, setPublishResult] = useState<{ txHash: string } | null>(null)
  const [error, setError] = useState<string>('')

  // Mic state
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [volume, setVolume] = useState<number>(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const animationRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)

  const { useCreateEpisode, isConnected } = useMindCastContract()
  const createEpisodeMutation = useCreateEpisode()

  // Load microphones
  const loadDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const all = await navigator.mediaDevices.enumerateDevices()
      const mics = all.filter((d) => d.kind === 'audioinput')
      setDevices(mics)
      if (!selectedDevice && mics[0]) setSelectedDevice(mics[0].deviceId)
      stream.getTracks().forEach((t) => t.stop())
    } catch (err) {
      console.error('Device load error:', err)
    }
  }

  useEffect(() => {
    loadDevices()
    navigator.mediaDevices.addEventListener('devicechange', loadDevices)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices)
    }
  }, [])

  const startRecording = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedDevice || undefined },
      })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        console.log('Recorded blob:', blob)
        setAudioBlob(blob)
      }

      // Live volume meter
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      const data = new Uint8Array(analyser.frequencyBinCount)
      source.connect(analyser)

      const measure = () => {
        analyser.getByteTimeDomainData(data)
        const avg = data.reduce((a, b) => a + Math.abs(b - 128), 0) / data.length
        setVolume(avg)
        animationRef.current = requestAnimationFrame(measure)
      }
      measure()

      mediaRecorder.start(1000)
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      setError('Failed to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      cancelAnimationFrame(animationRef.current!)
      setIsRecording(false)
      setVolume(0)
    }
  }

  const handlePublish = async () => {
    if (!audioBlob || !episodeTitle || !isConnected) return

    try {
      setUploadState('uploading')
      setError('')

      // Step 1: Upload audio to 0G Storage
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
      const formData = new FormData()
      formData.append('file', audioFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const uploadResult = await uploadResponse.json()
      setUploadResult(uploadResult)
      const audioCid = uploadResult.rootHash

      setUploadState('processing')

      // Step 2: Use 0G Inference with title and tags (no transcript)
      const inferenceResponse = await fetch('/api/inference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: episodeTitle,
          tags: episodeTags,
          audioHash: audioCid,
          // No transcript provided - AI will work with title and tags only
        }),
      })

      if (!inferenceResponse.ok) {
        const errorData = await inferenceResponse.json()
        throw new Error(errorData.error || 'AI processing failed')
      }

      const inferenceResult = await inferenceResponse.json()
      const { transcriptCid, summary, topics } = inferenceResult

      setUploadState('publishing')

      // Step 3: Publish to blockchain
      const txHash = await createEpisodeMutation.mutateAsync({
        title: episodeTitle,
        audioURI: audioCid,
        transcriptURI: transcriptCid,
        summary: summary,
        tags: episodeTags || topics,
      })

      setPublishResult({ txHash })
      setUploadState('success')

      // Reset form after success
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
      setError(error instanceof Error ? error.message : 'Publishing failed')
    }
  }

  const getButtonState = () => {
    switch (uploadState) {
      case 'uploading':
        return { variant: 'secondary' as const, text: 'Uploading to 0G...', icon: <Loader2 className="w-4 h-4 animate-spin" /> }
      case 'processing':
        return { variant: 'secondary' as const, text: 'AI Processing...', icon: <Loader2 className="w-4 h-4 animate-spin" /> }
      case 'publishing':
        return { variant: 'secondary' as const, text: 'Publishing to Blockchain...', icon: <Loader2 className="w-4 h-4 animate-spin" /> }
      case 'success':
        return { variant: 'premium' as const, text: 'Published Successfully!', icon: <CheckCircle className="w-4 h-4" /> }
      case 'error':
        return { variant: 'destructive' as const, text: 'Publish Failed - Try Again', icon: <Upload className="w-4 h-4" /> }
      default:
        return { variant: 'premium' as const, text: 'Publish to MindCast', icon: <Upload className="w-4 h-4" /> }
    }
  }

  const buttonState = getButtonState()

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Create Podcast Episode</h3>
        <div
          className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : uploadState !== 'idle' ? 'bg-blue-500' : 'bg-gray-600'
            }`}
        />
      </div>

      <div className="space-y-4">
        {/* Mic Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Microphone</label>
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-2"
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Microphone (${d.deviceId.slice(0, 5)})`}
              </option>
            ))}
          </select>
        </div>

        {/* Volume Meter */}
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-green-500 h-2 transition-all"
            style={{ width: `${Math.min(volume * 2, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">Mic volume: {volume.toFixed(1)}</p>

        {/* Record Button */}
        <div className="flex gap-3 flex-wrap">
          <Button
            variant={isRecording ? 'destructive' : 'premium'}
            onClick={isRecording ? stopRecording : startRecording}
            className="flex items-center gap-2"
            disabled={uploadState !== 'idle'}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
        </div>

        {/* Audio Preview & Publishing */}
        {audioBlob && (
          <div className="space-y-4">
            <audio controls src={URL.createObjectURL(audioBlob)} className="w-full rounded-lg" />

            {/* Episode Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Episode Title *</label>
                <input
                  type="text"
                  value={episodeTitle}
                  onChange={(e) => setEpisodeTitle(e.target.value)}
                  placeholder="Enter episode title..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  value={episodeTags}
                  onChange={(e) => setEpisodeTags(e.target.value)}
                  placeholder="web3, podcast, ai, technology..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide descriptive tags to help AI generate better summary
                </p>
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
                <p className="text-sm text-yellow-500 text-center">Please connect your wallet to publish</p>
              )}
            </div>

            {/* Upload Result */}
            {uploadResult && (
              <div className="bg-gray-800 rounded-lg p-3 text-sm">
                <div className="text-green-400 font-medium">0G Upload Successful</div>
                <div className="text-gray-400 text-xs break-all mt-1">Root Hash: {uploadResult.rootHash}</div>
                <div className="text-gray-400 text-xs break-all">TX: {uploadResult.transactionHash}</div>
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
                  onClick={() =>
                    window.open(`https://evm-testnet.0g.ai/tx/${publishResult.txHash}`, '_blank')
                  }
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View on Explorer
                </Button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
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
                    uploadState === 'uploading'
                      ? '33%'
                      : uploadState === 'processing'
                        ? '66%'
                        : uploadState === 'publishing'
                          ? '100%'
                          : '0%',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}