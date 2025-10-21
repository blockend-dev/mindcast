import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (typeof window !== 'undefined') {
      return NextResponse.json(
        { error: 'This route must run server-side' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = (formData.get('audio') || formData.get('file')) as File;
    console.log('File received:', file.name, file.type, file.size);


    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const RPC_URL = process.env.OG_RPC_URL;
    const INDEXER_RPC = process.env.INDEXER_RPC;
    const PRIVATE_KEY = process.env.PRIVATE_KEY

    if (!RPC_URL || !INDEXER_RPC || !PRIVATE_KEY) {
      return NextResponse.json({ error: '0G Storage configuration missing' }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const indexer = new Indexer(INDEXER_RPC);

    // Convert File → Buffer → Temp File
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempDir = '/tmp';
    const tempPath = join(tempDir, `audio-upload-${Date.now()}-${file.name}`);

    const fs = await import('fs');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    await writeFile(tempPath, buffer);

    // Upload to 0G Storage
    const zgFile = await ZgFile.fromFilePath(tempPath);
    const [tree, treeErr] = await zgFile.merkleTree();
    if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

    const [tx, uploadErr] = await indexer.upload(zgFile, RPC_URL, signer as any);
    if (uploadErr) throw new Error(`Upload failed: ${uploadErr}`);

    await zgFile.close();
    fs.unlinkSync(tempPath);

    return NextResponse.json({
      success: true,
      rootHash: tree?.rootHash() ?? '',
      transactionHash: tx.txHash,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
