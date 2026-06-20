import OpenAI, { toFile } from "openai";
import type { GPTEditRequest, GPTGenerateRequest, GPTGenerateResponse } from "./GPTTypes";

const DEFAULT_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class GPTClientError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message);
    this.name = "GPTClientError";
  }
}

/** 封装 OpenAI SDK — 业务代码禁止直接调用 SDK */
export class GPTClient {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new GPTClientError("OPENAI_API_KEY 未配置");
    }
    this.client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL?.trim() || undefined,
    });
    this.model = process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1";
  }

  async generate(request: GPTGenerateRequest): Promise<GPTGenerateResponse> {
    if (request.referenceImage) {
      return this.edit({
        prompt: request.prompt,
        image: request.referenceImage,
        imageMime: request.referenceMime ?? "image/png",
        size: request.size,
      });
    }
    return this.withRetry("generate", async () => {
      const response = await this.client.images.generate({
        model: this.model,
        prompt: request.prompt,
        size: request.size ?? "1024x1024",
        n: 1,
      });

      const buffers = await extractBuffers(response.data);
      if (buffers.length === 0) {
        throw new GPTClientError("OpenAI 未返回图片数据");
      }

      return {
        buffers,
        model: this.model,
        revisedPrompt: response.data?.[0]?.revised_prompt,
      };
    });
  }

  async edit(request: GPTEditRequest): Promise<GPTGenerateResponse> {
    return this.withRetry("edit", async () => {
      const file = await toFile(request.image, "reference.png", { type: request.imageMime });
      const response = await this.client.images.edit({
        model: this.model,
        image: file,
        prompt: request.prompt,
        size: request.size ?? "1024x1024",
        n: 1,
      });

      const buffers = await extractBuffers(response.data);
      if (buffers.length === 0) {
        throw new GPTClientError("OpenAI 编辑未返回图片数据");
      }

      return {
        buffers,
        model: this.model,
        revisedPrompt: response.data?.[0]?.revised_prompt,
      };
    });
  }

  private async withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= DEFAULT_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[GPTClient] ${label} attempt ${attempt}/${DEFAULT_RETRIES} failed:`, lastError.message);
        if (attempt < DEFAULT_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }
    throw new GPTClientError(lastError?.message ?? "OpenAI 请求失败");
  }
}

async function extractBuffers(
  data: Array<{ b64_json?: string | null; url?: string | null }> | undefined
): Promise<Buffer[]> {
  if (!data?.length) return [];
  const buffers: Buffer[] = [];
  for (const item of data) {
    if (item.b64_json) {
      buffers.push(Buffer.from(item.b64_json, "base64"));
      continue;
    }
    if (item.url) {
      const response = await fetch(item.url);
      if (!response.ok) {
        throw new GPTClientError("无法下载 OpenAI 返回的图片");
      }
      buffers.push(Buffer.from(await response.arrayBuffer()));
    }
  }
  return buffers;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let cachedClient: GPTClient | null = null;

export function getGPTClient(): GPTClient {
  if (!cachedClient) cachedClient = new GPTClient();
  return cachedClient;
}
