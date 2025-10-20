import { NextRequest, NextResponse } from 'next/server'
import { zeroGInference } from '@/app/lib/0g-inference'
import { zeroGStorage } from '@/app/lib/0g-storage'

export async function POST(request: NextRequest) {
  try {
    const { audioCid } = await request.json()

    if (!audioCid) {
      return NextResponse.json(
        { error: 'Audio CID is required' },
        { status: 400 }
      )
    }

    // Transcribe audio using 0G Inference
    const transcript = await zeroGInference.transcribeAudio(audioCid)
    
    // Generate summary
    const summary = await zeroGInference.generateSummary(transcript)
    
    // Step  Extract topics
    const topics = await zeroGInference.extractTopics(transcript)
    
    // Upload transcript to 0G Storage
    const transcriptData = {
      transcript,
      summary,
      topics,
      timestamp: Date.now(),
      audioCid: audioCid
    }
    
    const uploadResult = await zeroGStorage.uploadJSON(transcriptData)

    return NextResponse.json({
      success: true,
      transcript,
      summary,
      topics: topics.join(', '),
      transcriptCid: uploadResult.rootHash,
      transcriptTxHash: uploadResult.transactionHash,
      message: 'AI processing completed successfully using 0G Inference'
    })

  } catch (error) {
    console.error('Inference error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI processing failed' },
      { status: 500 }
    )
  }
}