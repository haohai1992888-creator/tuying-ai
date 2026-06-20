export interface GeminiGenerateRequest {
  prompt: string;
  size?: "1024x1024" | "1536x1024" | "1024x1536";
}

export interface GeminiGenerateResponse {
  buffers: Buffer[];
  model: string;
}

export interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { mimeType?: string; data?: string };
        text?: string;
      }>;
    };
  }>;
  error?: { message?: string; code?: string };
}
