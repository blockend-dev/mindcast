import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { Indexer } from '@0glabs/0g-ts-sdk';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rootHash: string }> }
) {
  try {
    const { rootHash } = await params;

    if (!rootHash) {
      return NextResponse.json(
        { error: 'Root hash is required' },
        { status: 400 }
      );
    }

    const INDEXER_RPC = process.env.NEXT_PUBLIC_INDEXER_RPC;
    if (!INDEXER_RPC) {
      return NextResponse.json(
        { error: '0G Storage configuration missing' },
        { status: 500 }
      );
    }

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

    // default
    let contentType = 'application/octet-stream'; 
    
    // Try to detect audio files
    if (rootHash.includes('audio') || fileBuffer.slice(0, 4).toString() === 'RIFF') {
      contentType = 'audio/webm';
    }

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