import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';

export class ZeroGStorage {
  private indexer: Indexer;
  private signer: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;

  constructor() {
    const RPC_URL = process.env.NEXT_PUBLIC_OG_RPC_URL || "https://evmrpc-testnet.0g.ai/";
    const INDEXER_RPC = process.env.NEXT_PUBLIC_INDEXER_RPC || "https://indexer-storage-testnet-standard.0g.ai";
    const PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY;

    if (!PRIVATE_KEY) {
      throw new Error("NEXT_PUBLIC_PRIVATE_KEY is required");
    }

    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    this.signer = new ethers.Wallet(PRIVATE_KEY, this.provider);
    this.indexer = new Indexer(INDEXER_RPC);
  }

  async uploadAudio(audioBlob: Blob): Promise<{ rootHash: string; transactionHash: string }> {
    try {
      // Convert Blob to Buffer
      const bytes = await audioBlob.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create temporary file path
      const tempDir = '/tmp';
      const tempPath = join(tempDir, `audio-upload-${Date.now()}.webm`);

      // Ensure temp directory exists
      const fs = await import('fs');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      await writeFile(tempPath, buffer);

      // Upload to 0G Storage
      const zgFile = await ZgFile.fromFilePath(tempPath);
      const [tree, treeErr] = await zgFile.merkleTree();

      if (treeErr !== null) {
        throw new Error(`Error generating Merkle tree: ${treeErr}`);
      }

      const [tx, uploadErr] = await this.indexer.upload(
        zgFile,
        process.env.NEXT_PUBLIC_OG_RPC_URL!,
        this.signer as any
      );

      if (uploadErr !== null) {
        throw new Error(`Upload error: ${uploadErr}`);
      }

      await zgFile.close();

      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      return {
        rootHash: tree?.rootHash() ?? "",
        transactionHash: tx.txHash,
      };
    } catch (error) {
      console.error('Failed to upload audio to 0G:', error);
      throw new Error('Audio upload failed');
    }
  }

  async uploadJSON(data: any): Promise<{ rootHash: string; transactionHash: string }> {
    try {
      const jsonString = JSON.stringify(data);
      const buffer = Buffer.from(jsonString, 'utf-8');

      // Create temporary file path
      const tempDir = '/tmp';
      const tempPath = join(tempDir, `metadata-upload-${Date.now()}.json`);

      // Ensure temp directory exists
      const fs = await import('fs');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      await writeFile(tempPath, buffer);

      // Upload to 0G Storage
      const zgFile = await ZgFile.fromFilePath(tempPath);
      const [tree, treeErr] = await zgFile.merkleTree();

      if (treeErr !== null) {
        throw new Error(`Error generating Merkle tree: ${treeErr}`);
      }

      const [tx, uploadErr] = await this.indexer.upload(
        zgFile,
        process.env.NEXT_PUBLIC_OG_RPC_URL!,
        this.signer as any
      );

      if (uploadErr !== null) {
        throw new Error(`Upload error: ${uploadErr}`);
      }

      await zgFile.close();

      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      return {
        rootHash: tree?.rootHash() ?? "",
        transactionHash: tx.txHash,
      };
    } catch (error) {
      console.error('Failed to upload JSON to 0G:', error);
      throw new Error('Metadata upload failed');
    }
  }

  async downloadFile(rootHash: string): Promise<Buffer> {
    try {
      const downloadsDir = '/tmp';
      const outputPath = join(downloadsDir, `${rootHash}.file`);

      // Ensure downloads directory exists
      const fs = await import('fs');
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      const err = await this.indexer.download(rootHash, outputPath, true);
      
      if (err !== null) {
        throw new Error(`Download error: ${err}`);
      }

      const fileBuffer = fs.readFileSync(outputPath);
      
      // Clean up temp file
      fs.unlinkSync(outputPath);

      return fileBuffer;
    } catch (error) {
      console.error('Failed to fetch file from 0G:', error);
      throw new Error('File retrieval failed');
    }
  }

//   async downloadFileAsBlob(rootHash: string, filename: string): Promise<Blob> {
//     try {
//       const buffer = await this.downloadFile(rootHash);
//       return new Blob([buffer], { type: 'application/octet-stream' });
//     } catch (error) {
//       console.error('Failed to download file as blob:', error);
//       throw new Error('Download failed');
//     }
//   }

}

export const zeroGStorage = new ZeroGStorage();