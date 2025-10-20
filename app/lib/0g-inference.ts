import { createZGComputeNetworkBroker, ZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { ethers } from "ethers";
import OpenAI from "openai";

// Official 0G providers
const OFFICIAL_PROVIDERS = {
  "llama-3.3-70b-instruct": "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
  "deepseek-r1-70b": "0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3"
};

export class ZeroGInference {
  private broker: ZGComputeNetworkBroker | null = null;
  private wallet: ethers.Wallet | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const privateKey = process.env.ZEROG_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('ZEROG_PRIVATE_KEY is required');
      }
      
      const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
      this.wallet = new ethers.Wallet(privateKey, provider);
      this.broker = await createZGComputeNetworkBroker(this.wallet);
      this.initialized = true;
      console.log("0G Inference initialized successfully");
    } catch (error: any) {
      console.error("Failed to initialize 0G Inference:", error.message);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!this.broker || !this.wallet) {
      throw new Error("0G Inference not properly initialized");
    }
  }

  async transcribeAudio(audioCid: string): Promise<string> {
    await this.ensureInitialized();

    try {
      // For audio transcription, we need to use a provider that supports audio processing
      // This is a simplified example - you might need to adjust based on available services
      const providerAddress = OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];
      
      // First, acknowledge the provider
      await this.broker!.inference.acknowledgeProviderSigner(providerAddress);

      // Create a query for transcription
      const query = `Please transcribe the audio file with CID: ${audioCid}. The audio is in webm format and contains podcast content.`;

      const { endpoint, model } = await this.broker!.inference.getServiceMetadata(providerAddress);
      const headers = await this.broker!.inference.getRequestHeaders(providerAddress, query);

      const openai = new OpenAI({
        baseURL: endpoint,
        apiKey: "",
      });

      const requestHeaders: Record<string, string> = {};
      Object.entries(headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          requestHeaders[key] = value;
        }
      });

      const completion = await openai.chat.completions.create(
        {
          messages: [{ role: "user", content: query }],
          model,
        },
        {
          headers: requestHeaders,
        }
      );

      const content = completion.choices[0].message.content;
      
      // Process payment
      const isValid = await this.broker!.inference.processResponse(
        providerAddress,
        content || "",
        completion.id
      );

      if (!content) {
        throw new Error("No transcription content received");
      }

      return content;
    } catch (error) {
      console.error('Audio transcription failed:', error);
      throw new Error('Transcription service unavailable');
    }
  }

  async generateSummary(transcript: string): Promise<string> {
    await this.ensureInitialized();

    try {
      const providerAddress = OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];
      await this.broker!.inference.acknowledgeProviderSigner(providerAddress);

      const query = `Please provide a concise summary (around 200 words) of the following podcast transcript:\n\n${transcript}`;

      const { endpoint, model } = await this.broker!.inference.getServiceMetadata(providerAddress);
      const headers = await this.broker!.inference.getRequestHeaders(providerAddress, query);

      const openai = new OpenAI({
        baseURL: endpoint,
        apiKey: "",
      });

      const requestHeaders: Record<string, string> = {};
      Object.entries(headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          requestHeaders[key] = value;
        }
      });

      const completion = await openai.chat.completions.create(
        {
          messages: [{ role: "user", content: query }],
          model,
          max_tokens: 300,
        },
        {
          headers: requestHeaders,
        }
      );

      const content = completion.choices[0].message.content;
      
      await this.broker!.inference.processResponse(
        providerAddress,
        content || "",
        completion.id
      );

      if (!content) {
        throw new Error("No summary content received");
      }

      return content;
    } catch (error) {
      console.error('Summary generation failed:', error);
      throw new Error('Summary service unavailable');
    }
  }

  async extractTopics(transcript: string): Promise<string[]> {
    await this.ensureInitialized();

    try {
      const providerAddress = OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];
      await this.broker!.inference.acknowledgeProviderSigner(providerAddress);

      const query = `Extract 3-5 main topics or keywords from the following podcast transcript. Return them as a comma-separated list:\n\n${transcript}`;

      const { endpoint, model } = await this.broker!.inference.getServiceMetadata(providerAddress);
      const headers = await this.broker!.inference.getRequestHeaders(providerAddress, query);

      const openai = new OpenAI({
        baseURL: endpoint,
        apiKey: "",
      });

      const requestHeaders: Record<string, string> = {};
      Object.entries(headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          requestHeaders[key] = value;
        }
      });

      const completion = await openai.chat.completions.create(
        {
          messages: [{ role: "user", content: query }],
          model,
          max_tokens: 100,
        },
        {
          headers: requestHeaders,
        }
      );

      const content = completion.choices[0].message.content;
      
      await this.broker!.inference.processResponse(
        providerAddress,
        content || "",
        completion.id
      );

      if (!content) {
        return [];
      }

      // Parse comma-separated topics
      return content.split(',').map(topic => topic.trim()).filter(topic => topic.length > 0);
    } catch (error) {
      console.error('Topic extraction failed:', error);
      return [];
    }
  }

  async getBalance(): Promise<any> {
    await this.ensureInitialized();
    return await this.broker!.ledger.getLedger();
  }

  async depositFunds(amount: number): Promise<string> {
    await this.ensureInitialized();
    await this.broker!.ledger.depositFund(amount);
    return "Deposit successful";
  }

  async listServices(): Promise<any[]> {
    await this.ensureInitialized();
    const services = await this.broker!.inference.listService();
    
    return services.map((service: any) => ({
      ...service,
      inputPriceFormatted: ethers.formatEther(service.inputPrice || 0),
      outputPriceFormatted: ethers.formatEther(service.outputPrice || 0),
      isOfficial: Object.values(OFFICIAL_PROVIDERS).includes(service.provider),
      isVerifiable: service.verifiability === 'TeeML',
      modelName: Object.entries(OFFICIAL_PROVIDERS).find(([_, addr]) => addr === service.provider)?.[0] || 'Unknown'
    }));
  }
}

export const zeroGInference = new ZeroGInference();