import type { SeedreamApiResponse, SeedreamEditRequest, SeedreamGenerateRequest, SeedreamGenerateResponse } from "./SeedreamTypes";

const DEFAULT_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class SeedreamClientError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message);
    this.name = "SeedreamClientError";
  }
}

/** 封装 Seedream / ModelArk HTTP API — 业务代码禁止直接调用 */
export class SeedreamClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.SEEDREAM_API_KEY?.trim();
    if (!apiKey) {
      throw new SeedreamClientError("SEEDREAM_API_KEY 未配置");
    }
    this.apiKey = apiKey;
    this.baseUrl = (process.env.SEEDREAM_BASE_URL ?? "https://ark.ap-southeast.bytepluses.com/api/v3").replace(/\/$/, "");
    this.model = process.env.SEEDREAM_MODEL?.trim() || "seedream-3-0-t2i-250415";
  }

  async generate(request: SeedreamGenerateRequest): Promise<SeedreamGenerateResponse> {
    if (request.referenceImage || request.referenceImages?.length) {
      return this.imageToImage(request);
    }
    return this.textToImage(request);
  }

  async edit(request: SeedreamEditRequest): Promise<SeedreamGenerateResponse> {
    return this.withRetry("edit", async () => {
      const body = {
        model: this.model,
        prompt: request.prompt,
        image: request.image.toString("base64"),
        size: request.size ?? "1024x1024",
        response_format: "b64_json",
      };

      const response = await this.post("/images/generations", body);
      return this.toResponse(response);
    });
  }

  private async textToImage(request: SeedreamGenerateRequest): Promise<SeedreamGenerateResponse> {
    return this.withRetry("generate", async () => {
      const body = {
        model: this.model,
        prompt: request.prompt,
        size: request.size ?? "1024x1024",
        response_format: "b64_json",
      };

      const response = await this.post("/images/generations", body);
      return this.toResponse(response);
    });
  }

  private async imageToImage(request: SeedreamGenerateRequest): Promise<SeedreamGenerateResponse> {
    return this.withRetry("imageToImage", async () => {
      const primary = request.referenceImage ?? request.referenceImages?.[0]?.buffer;
      if (!primary) throw new SeedreamClientError("缺少参考图片");

      const body: Record<string, unknown> = {
        model: this.model,
        prompt: request.prompt,
        image: primary.toString("base64"),
        size: request.size ?? "1024x1024",
        response_format: "b64_json",
      };

      const response = await this.post("/images/generations", body);
      return this.toResponse(response);
    });
  }

  private async post(path: string, body: Record<string, unknown>): Promise<SeedreamApiResponse> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as SeedreamApiResponse;
    if (!res.ok) {
      throw new SeedreamClientError(json.error?.message ?? `Seedream API 错误 (${res.status})`, json.error?.code);
    }
    return json;
  }

  private toResponse(response: SeedreamApiResponse): SeedreamGenerateResponse {
    const buffers = extractBuffers(response.data);
    if (buffers.length === 0) {
      throw new SeedreamClientError("Seedream 未返回图片数据");
    }
    return { buffers, model: this.model };
  }

  private async withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= DEFAULT_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[SeedreamClient] ${label} attempt ${attempt}/${DEFAULT_RETRIES} failed:`, lastError.message);
        if (attempt < DEFAULT_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }
    throw new SeedreamClientError(lastError?.message ?? "Seedream 请求失败");
  }
}

function extractBuffers(data: Array<{ b64_json?: string; url?: string }> | undefined): Buffer[] {
  if (!data?.length) return [];
  const buffers: Buffer[] = [];
  for (const item of data) {
    if (item.b64_json) buffers.push(Buffer.from(item.b64_json, "base64"));
  }
  return buffers;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let cachedClient: SeedreamClient | null = null;

export function getSeedreamClient(): SeedreamClient {
  if (!cachedClient) cachedClient = new SeedreamClient();
  return cachedClient;
}

export function isSeedreamConfigured(): boolean {
  return Boolean(process.env.SEEDREAM_API_KEY?.trim());
}
