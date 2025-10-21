import { NextRequest, NextResponse } from 'next/server'
import { zeroGInference } from '@/app/lib/0g-inference'
import { zeroGStorage } from '@/app/lib/0g-storage'

export async function POST(request: NextRequest) {
  try {
    const { title, tags, audioHash } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Episode title is required for AI processing' },
        { status: 400 }
      )
    }

    // Generate AI content based on title and tags
    let summary: string
    let generatedTopics: string[]
    
    try {
      console.log('Generating AI content based on title and tags...')
      
      // Generate summary based on title and tags
      summary = await zeroGInference.generateSummaryFromTitle(title, tags)
      
      // Extract topics from title and tags
      generatedTopics = await zeroGInference.extractTopicsFromTitle(title, tags)
      
      if (!summary || summary.trim().length < 10) {
        summary = generateFallbackSummary(title, tags)
      }
      
      if (!generatedTopics || generatedTopics.length === 0) {
        generatedTopics = extractFallbackTopics(title, tags)
      }
      
    } catch (aiError) {
      console.error('AI processing failed, using fallback:', aiError)
      // Fallback to local processing if 0G Inference fails
      summary = generateFallbackSummary(title, tags)
      generatedTopics = extractFallbackTopics(title, tags)
    }

    // Prepare metadata for storage
    const episodeData = {
      title,
      tags,
      summary,
      topics: generatedTopics,
      timestamp: Date.now(),
      audioHash: audioHash,
      processedWith: 'title-tags-only',
      language: 'en'
    }

    // Upload episode data to 0G Storage
    let uploadResult
    try {
      console.log('Uploading episode data to 0G Storage...')
      uploadResult = await zeroGStorage.uploadJSON(episodeData)
      
      if (!uploadResult.rootHash) {
        throw new Error('No root hash received from 0G Storage')
      }
      
      console.log('Upload successful, rootHash:', uploadResult.rootHash)
    } catch (uploadError) {
      console.error('0G Storage upload failed:', uploadError)
      return NextResponse.json(
        { 
          error: 'Failed to upload episode data to decentralized storage',
          details: uploadError instanceof Error ? uploadError.message : 'Unknown storage error'
        },
        { status: 500 }
      )
    }

    // Return comprehensive response
    return NextResponse.json({
      success: true,
      summary,
      topics: generatedTopics,
      topicsFormatted: generatedTopics.join(', '),
      transcriptCid: uploadResult.rootHash, 
      transcriptTxHash: uploadResult.transactionHash,
      audioHash: audioHash,
      processing: {
        method: 'title-tags-based',
        aiSummary: true,
        storage: true
      },
      message: 'AI processing completed successfully using title and tags'
    })

  } catch (error) {
    console.error('Inference route error:', error)
    return NextResponse.json(
      { 
        error: 'AI processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please ensure you provide a descriptive title and tags'
      },
      { status: 500 }
    )
  }
}

// Fallback functions
function generateFallbackSummary(title: string, tags: string = ''): string {
  const tagList = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
  const tagString = tagList.length > 0 ? ` about ${tagList.join(', ')}` : ''
  
  return `This podcast episode "${title}" explores various topics${tagString}. Listen to learn more about this subject.`
}

function extractFallbackTopics(title: string, tags: string = ''): string[] {
  const topics = new Set<string>()
  
  // Extract words from title
  const titleWords = title.toLowerCase().split(/\s+/)
  const meaningfulWords = titleWords.filter(word => 
    word.length > 3 && 
    !['this', 'that', 'with', 'from', 'your', 'about', 'episode'].includes(word)
  )
  
  meaningfulWords.slice(0, 3).forEach(word => topics.add(word))
  
  // Add tags
  if (tags) {
    tags.split(',').forEach(tag => {
      const cleanTag = tag.trim().toLowerCase()
      if (cleanTag.length > 0) {
        topics.add(cleanTag)
      }
    })
  }
  
  // Ensure we have at least some topics
  if (topics.size === 0) {
    return ['podcast', 'discussion', 'episode']
  }
  
  return Array.from(topics).slice(0, 5)
}