// src/services/deepseekService.ts
import axios from 'axios';
import { DeepSeekRequest, DeepSeekResponse, DeepSeekMessage } from '../../../shared/types';

/** Kiểu lỗi trả về từ DeepSeek API */
type DeepseekApiError = {
  error?: {
    message?: string;
    type?: string;
    code?: string | number;
  };
};

/** Type guard: thu hẹp unknown thành DeepseekApiError */
function isDeepseekApiError(x: unknown): x is DeepseekApiError {
  return typeof x === 'object' && x !== null && 'error' in x;
}

export class DeepSeekService {
  private apiKey: string = '';
  private baseUrl: string = '';
  private initialized: boolean = false;

  constructor() {
    // Không khởi tạo ngay lập tức
  }

  private initialize() {
    if (this.initialized) return;
    
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY is required');
    }
    
    this.initialized = true;
  }

  async chat(
    messages: DeepSeekMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<DeepSeekResponse> {
    this.initialize(); // Khởi tạo khi cần
    const {
      model = 'deepseek-chat',
      temperature = 0.7,
      maxTokens = 2048,
      stream = false,
    } = options;

    const requestBody: DeepSeekRequest = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream,
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            // nếu stream=true và dùng axios (không khuyến nghị cho SSE), có thể cần Accept;
            // tuy nhiên ở luồng stream đã dùng fetch riêng.
          },
          timeout: 30_000, // 30s
        }
      );

      return response.data as DeepSeekResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const dataUnknown: unknown = error.response?.data;
        const apiMessage =
          (isDeepseekApiError(dataUnknown) && dataUnknown.error?.message) ||
          error.message;

        switch (status) {
          case 401:
            throw new Error('Invalid API key');
          case 429:
            throw new Error('Rate limit exceeded');
          case 500:
            throw new Error('DeepSeek API server error');
          default:
            throw new Error(`DeepSeek API error: ${apiMessage}`);
        }
      }
      throw new Error('Network error occurred');
    }
  }

  async streamChat(
    messages: DeepSeekMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<ReadableStream<Uint8Array>> {
    this.initialize(); // Khởi tạo khi cần
    const {
      model = 'deepseek-chat',
      temperature = 0.7,
      maxTokens = 2048,
    } = options;

    const requestBody: DeepSeekRequest = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    };

    try {
      // Yêu cầu Node 18+ (có global fetch). Nếu dùng phiên bản cũ, cần polyfill (node-fetch).
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream', // SSE cho streaming
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // response.json() trả về unknown -> thu hẹp bằng type guard
        let msg = `HTTP ${response.status} ${response.statusText}`;
        try {
          const errorData: unknown = await response.json();
          if (isDeepseekApiError(errorData) && typeof errorData.error?.message === 'string') {
            msg = errorData.error.message;
          }
        } catch {
          // JSON parse thất bại -> giữ msg mặc định
        }
        throw new Error(msg);
      }

      // Web ReadableStream (WHATWG). Ở Node 18+ có sẵn kiểu ReadableStream<Uint8Array>.
      const body = response.body;
      if (!body) {
        throw new Error('No response body for stream');
      }
      return body as ReadableStream<Uint8Array>;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Streaming error: ${msg}`);
    }
  }

  // Ước lượng token (xấp xỉ)
  estimateTokens(text: string): number {
    // 1 token ≈ 4 ký tự (ước lượng cho tiếng Anh; với TV có thể sai lệch)
    return Math.ceil(text.length / 4);
  }

  // Cắt bớt messages nếu vượt giới hạn token
  truncateMessages(messages: DeepSeekMessage[], maxTokens: number = 4000): DeepSeekMessage[] {
    let totalTokens = 0;
    const truncated: DeepSeekMessage[] = [];

    // Duyệt ngược từ message mới nhất
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      const tks = this.estimateTokens(m.content);
      if (totalTokens + tks <= maxTokens) {
        truncated.unshift(m);
        totalTokens += tks;
      } else {
        break;
      }
    }
    return truncated;
  }
}

// Export instance nhưng không khởi tạo ngay
export const deepSeekService = new DeepSeekService();
