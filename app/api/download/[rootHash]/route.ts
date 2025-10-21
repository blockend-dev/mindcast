import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { Indexer } from '@0glabs/0g-ts-sdk';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rootHash: string }> }
) {
  try {
    const { rootHash } = await params;

    const INDEXER_RPC = process.env.NEXT_PUBLIC_INDEXER_RPC!;
    const indexer = new Indexer(INDEXER_RPC);

    const downloadsDir = '/tmp';
    const outputPath = join(downloadsDir, `${rootHash}.file`);

    const fs = await import('fs');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    const err = await indexer.download(rootHash, outputPath, true);
    
    if (err !== null) {
      throw new Error(`Download error: ${err}`);
    }

    const fileBuffer = fs.readFileSync(outputPath);
    
    // Clean up temp file
    fs.unlinkSync(outputPath);

    // Try to parse as JSON first (for transcripts)
    try {
      const content = fileBuffer.toString('utf-8');
      const jsonData = JSON.parse(content);
      
      // If it's a transcript JSON, return as JSON
      if (jsonData.transcript || jsonData.summary) {
        return NextResponse.json(jsonData);
      }
    } catch (jsonError) {
      // Not JSON, continue as binary file
    }

    // Determine content type based on file content or extension
    let contentType = 'application/octet-stream';
    
    // Check for audio files
    if (fileBuffer.slice(0, 4).toString() === 'RIFF') {
      contentType = 'audio/wav';
    } else if (fileBuffer.slice(0, 3).toString() === 'ID3') {
      contentType = 'audio/mpeg';
    } else if (fileBuffer.slice(0, 4).toString() === 'fLaC') {
      contentType = 'audio/flac';
    }

    // For audio files, return as audio stream
    if (contentType.startsWith('audio/')) {
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="audio-${rootHash}"`,
        },
      });
    }

    // For other files, return as download
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${rootHash}.file"`,
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}