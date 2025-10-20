'use client'

import { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Mic, Square, Upload } from 'lucide-react'

export function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const uploadAudio = async () => {
    if (!audioBlob) return

    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.wav')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Upload successful:', result)
        // Handle successful upload
      }
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">Record Podcast</h3>
        <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-3">
          <Button
            variant={isRecording ? "destructive" : "premium"}
            onClick={isRecording ? stopRecording : startRecording}
            className="flex items-center gap-2"
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
          
          {audioBlob && (
            <Button
              variant="outline"
              onClick={uploadAudio}
              className="flex items-center gap-2 border-gray-700 text-white hover:bg-gray-800"
            >
              <Upload className="w-4 h-4" />
              Upload to 0G
            </Button>
          )}
        </div>
        
        {audioBlob && (
          <audio
            controls
            src={URL.createObjectURL(audioBlob)}
            className="w-full rounded-lg"
          />
        )}
      </div>
    </div>
  )
}