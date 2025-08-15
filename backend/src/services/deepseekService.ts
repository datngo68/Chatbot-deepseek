import axios from 'axios';
import { DeepSeekRequest, DeepSeekResponse, DeepSeekMessage } from '../../../shared/types';

export class DeepSeekService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.baseUrl = 'https://api.deepseek.com/v1';
    
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY is required');
    }
  }

  async chat(messages: DeepSeekMessage[], options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  } = {}): Promise<DeepSeekResponse> {
    const {
      model = 'deepseek-chat',
      temperature = 0.7,
      maxTokens = 2048,
      stream = false
    } = options;

    const requestBody: DeepSeekRequest = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;
        
        switch (status) {
          case 401:
            throw new Error('Invalid API key');
          case 429:
            throw new Error('Rate limit exceeded');
          case 500:
            throw new Error('DeepSeek API server error');
          default:
            throw new Error(`DeepSeek API error: ${message}`);
        }
      }
      throw new Error('Network error occurred');
    }
  }

  async streamChat(messages: DeepSeekMessage[], options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}): Promise<ReadableStream> {
    const {
      model = 'deepseek-chat',
      temperature = 0.7,
      maxTokens = 2048
    } = options;

    const requestBody: DeepSeekRequest = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return response.body as ReadableStream;
    } catch (error) {
      throw new Error(`Streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to estimate tokens (rough estimation)
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  // Helper method to truncate messages if they exceed token limit
  truncateMessages(messages: DeepSeekMessage[], maxTokens: number = 4000): DeepSeekMessage[] {
    let totalTokens = 0;
    const truncatedMessages: DeepSeekMessage[] = [];

    // Start from the most recent messages and work backwards
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const messageTokens = this.estimateTokens(message.content);
      
      if (totalTokens + messageTokens <= maxTokens) {
        truncatedMessages.unshift(message);
        totalTokens += messageTokens;
      } else {
        break;
      }
    }

    return truncatedMessages;
  }
}

export const deepSeekService = new DeepSeekService();
