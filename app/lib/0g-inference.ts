import { createZGComputeNetworkBroker, ZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { ethers } from "ethers";
import OpenAI from "openai";

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
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('PRIVATE_KEY is required');
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

  /**
   * Generate podcast summary based on title and tags
   */
  async generateSummaryFromTitle(title: string, tags?: string): Promise<string> {
    await this.ensureInitialized();

    try {
      const providerAddress = OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];
      await this.broker!.inference.acknowledgeProviderSigner(providerAddress);

      const query = this.buildSummaryPrompt(title, tags);

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
          max_tokens: 200,
          temperature: 0.7,
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

      return this.cleanSummaryResponse(content);
    } catch (error) {
      console.error('Summary generation from title failed:', error);
      // Fallback to local generation
      return this.generateLocalSummary(title, tags);
    }
  }

  /**
   * Extract topics from title and tags
   */
  async extractTopicsFromTitle(title: string, tags?: string): Promise<string[]> {
    await this.ensureInitialized();

    try {
      const providerAddress = OFFICIAL_PROVIDERS["llama-3.3-70b-instruct"];
      await this.broker!.inference.acknowledgeProviderSigner(providerAddress);

      const query = this.buildTopicsPrompt(title, tags);

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
          temperature: 0.3,
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
        return this.extractLocalTopics(title, tags);
      }

      return this.parseTopicsResponse(content);
    } catch (error) {
      console.error('Topic extraction from title failed:', error);
      return this.extractLocalTopics(title, tags);
    }
  }

  /**
   * Process complete episode information using title and tags
   */
  async processEpisodeInfo(title: string, tags?: string): Promise<{
    summary: string;
    topics: string[];
    success: boolean;
  }> {
    try {
      console.log('Processing episode info with 0G Inference:', { title, tags });

      // Generate both summary and topics in parallel
      const [summary, topics] = await Promise.all([
        this.generateSummaryFromTitle(title, tags),
        this.extractTopicsFromTitle(title, tags)
      ]);

      return {
        summary,
        topics,
        success: true
      };
    } catch (error) {
      console.error('0G Inference processing failed:', error);
      // Fallback to local processing
      return this.processLocally(title, tags);
    }
  }

  /**
   * Build prompt for summary generation
   */
  private buildSummaryPrompt(title: string, tags?: string): string {
    const tagContext = tags ? `Tags: ${tags}. ` : '';
    
    return `As a podcast content AI, create a compelling episode summary based on the following information:

Episode Title: "${title}"
${tagContext}

Requirements:
- Generate a 2-3 sentence engaging summary
- Make it sound professional and intriguing
- Focus on the main topic suggested by the title
- Use active voice and compelling language
- Target length: 50-100 words

Podcast Episode Summary:`;
  }

  /**
   * Build prompt for topics extraction
   */
  private buildTopicsPrompt(title: string, tags?: string): string {
    const tagContext = tags ? `Existing tags: ${tags}. ` : '';
    
    return `Extract key topics and themes from this podcast episode information:

Episode Title: "${title}"
${tagContext}

Requirements:
- Extract 3-5 main topics
- Return as comma-separated values
- Focus on substantive themes
- Use lowercase, single words or short phrases
- Be specific and relevant to the title

Key Topics:`;
  }

  /**
   * Clean and format the summary response
   */
  private cleanSummaryResponse(summary: string): string {
    return summary
      .trim()
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/^(Summary|Description):\s*/i, '') // Remove leading labels
      .slice(0, 250); // Limit length
  }

  /**
   * Parse topics from API response
   */
  private parseTopicsResponse(response: string): string[] {
    return response
      .trim()
      .split(',')
      .map(topic => topic.trim().toLowerCase())
      .filter(topic => 
        topic.length > 0 && 
        topic.length <= 25 && // Reasonable topic length
        !topic.match(/^(topics?|keywords?|themes?):?$/i) // Remove meta words
      )
      .slice(0, 5); // Limit to 5 topics
  }

  /**
   * Fallback local summary generation
   */
  private generateLocalSummary(title: string, tags?: string): string {
    const tagList = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
    const tagContext = tagList.length > 0 ? ` covering ${tagList.join(', ')}` : '';
    
    const summaries = [
      `Join us for an insightful discussion about "${title}"${tagContext}. We explore key concepts and share valuable perspectives on this important topic.`,
      `In this episode, we dive deep into "${title}"${tagContext}. Discover new insights and practical knowledge that you can apply right away.`,
      `Explore the world of "${title}" in this engaging podcast episode${tagContext}. We break down complex ideas and share expert analysis.`,
      `This episode focuses on "${title}"${tagContext}, offering fresh perspectives and thought-provoking discussions on current trends and developments.`
    ];
    
    return summaries[Math.floor(Math.random() * summaries.length)];
  }

  /**
   * Fallback local topics extraction
   */
  private extractLocalTopics(title: string, tags?: string): string[] {
    const topics = new Set<string>();
    
    // Extract meaningful words from title
    const titleWords = title.toLowerCase().split(/\s+/);
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'this', 'that',
      'these', 'those', 'about', 'your', 'our', 'my', 'their', 'episode'
    ]);
    
    titleWords.forEach(word => {
      const cleanWord = word.replace(/[^a-z0-9]/g, '');
      if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
        topics.add(cleanWord);
      }
    });
    
    // Add tags if provided
    if (tags) {
      tags.split(',').forEach(tag => {
        const cleanTag = tag.trim().toLowerCase();
        if (cleanTag.length > 0) {
          topics.add(cleanTag);
        }
      });
    }
    
    // Ensure we have some topics
    if (topics.size === 0) {
      return ['technology', 'discussion', 'insights'];
    }
    
    return Array.from(topics).slice(0, 5);
  }

  /**
   * Complete local fallback processing
   */
  private processLocally(title: string, tags?: string): {
    summary: string;
    topics: string[];
    success: boolean;
  } {
    const summary = this.generateLocalSummary(title, tags);
    const topics = this.extractLocalTopics(title, tags);
    
    return {
      summary,
      topics,
      success: false // Mark as fallback
    };
  }

  // Keep the original methods for backward compatibility but mark as deprecated
  async transcribeAudio(audioCid: string): Promise<string> {
    console.warn('transcribeAudio is deprecated - use title and tags based methods instead');
    throw new Error('Audio transcription not supported - use title and tags based methods');
  }

  async generateSummary(transcript: string): Promise<string> {
    console.warn('generateSummary with transcript is deprecated - use generateSummaryFromTitle instead');
    throw new Error('Transcript-based summary not supported - use title and tags based methods');
  }

  async extractTopics(transcript: string): Promise<string[]> {
    console.warn('extractTopics with transcript is deprecated - use extractTopicsFromTitle instead');
    throw new Error('Transcript-based topic extraction not supported - use title and tags based methods');
  }

  // Utility methods for balance and services
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

// Utility functions for direct use
export const generateSummary = (title: string, tags?: string): Promise<string> => {
  return zeroGInference.generateSummaryFromTitle(title, tags);
};

export const extractTopics = (title: string, tags?: string): Promise<string[]> => {
  return zeroGInference.extractTopicsFromTitle(title, tags);
};

export const processEpisode = (title: string, tags?: string): Promise<{
  summary: string;
  topics: string[];
  success: boolean;
}> => {
  return zeroGInference.processEpisodeInfo(title, tags);
};