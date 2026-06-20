import type { GeminiApiResponse, GeminiGenerateRequest, GeminiGenerateResponse } from "./GeminiTypes";

const DEFAULT_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class GeminiClientError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message);
    this.name = "GeminiClientError";
  }
}

/** Gemini Flash Image — Google Generative Language API */
export class GeminiClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new GeminiClientError("GEMINI_API_KEY 未配置");
    }
    this.apiKey = apiKey;
    this.model = process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-2.0-flash-preview-image-generation";
    this.baseUrl = (process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");
  }

  async generate(request: GeminiGenerateRequest): Promise<GeminiGenerateResponse> {
    return this.withRetry("generate", async () => {
      const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: request.prompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE"],
          },
        }),
      });

      const json = (await res.json()) as GeminiApiResponse;
      if (!res.ok) {
        throw new GeminiClientError(json.error?.message ?? `Gemini API 错误 (${res.status})`, json.error?.code);
      }

      const buffers = extractBuffers(json);
      if (buffers.length === 0) {
        throw new GeminiClientError("Gemini 未返回图片数据");
      }

      return { buffers, model: this.model };
    });
  }

  private async withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= DEFAULT_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[GeminiClient] ${label} attempt ${attempt}/${DEFAULT_RETRIES} failed:`, lastError.message);
        if (attempt < DEFAULT_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }
    throw new GeminiClientError(lastError?.message ?? "Gemini 请求失败");
  }
}

function extractBuffers(response: GeminiApiResponse): Buffer[] {
  const buffers: Buffer[] = [];
  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      buffers.push(Buffer.from(part.inlineData.data, "base64"));
    }
  }
  return buffers;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let cachedClient: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!cachedClient) cachedClient = new GeminiClient();
  return cachedClient;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}
