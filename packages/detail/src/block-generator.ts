import { getAIProvider } from "@acs/ai-providers";
import { fetchImageBuffer, saveGeneratedResult } from "@acs/files";
import { getFailoverChain, modelUsageService } from "@acs/router";
import { AIProviderId, DETAIL_BLOCK_PROVIDER, DetailBlockType } from "@acs/shared";
import { buildDetailBlockPrompt } from "./detail-prompt-builder";

export interface GenerateBlockInput {
  userId: string;
  detailTaskId: string;
  blockId: string;
  blockType: DetailBlockType;
  productName: string;
  sellingPoints: string[];
  inputUrl: string;
  category?: string;
  preferredProvider?: string;
}

export interface GenerateBlockResult {
  imageUrl: string;
  provider: string;
  prompt: string;
  mock: boolean;
}

async function loadSharp() {
  const mod = await import("sharp");
  return mod.default;
}

/** 生成单个详情页模块图片 */
export async function generateDetailBlock(input: GenerateBlockInput): Promise<GenerateBlockResult> {
  const prompt = buildDetailBlockPrompt({
    blockType: input.blockType,
    productName: input.productName,
    sellingPoints: input.sellingPoints,
    category: input.category,
  });

  const preferred = DETAIL_BLOCK_PROVIDER[input.blockType] ?? "seedream";
  const providerId = (input.preferredProvider && input.preferredProvider !== "auto"
    ? input.preferredProvider
    : preferred === "gpt"
      ? AIProviderId.GPT
      : AIProviderId.SEEDREAM) as AIProviderId;

  const chain = getFailoverChain(providerId);
  const referenceUrls = [input.inputUrl];

  let lastError: Error | null = null;

  for (const pid of chain) {
    const started = Date.now();
    try {
      const provider = getAIProvider(pid);
      const result = await provider.generate({ prompt, referenceUrls });
      const duration = Date.now() - started;

      void modelUsageService.record({
        provider: pid,
        taskType: "detail_page",
        success: true,
        duration,
        taskId: input.detailTaskId,
        userId: input.userId,
        cost: 0,
      });

      let buffer: Buffer;
      const url = result.urls?.[0];
      if (url && !url.startsWith("mock://") && !result.mock) {
        buffer = await fetchImageBuffer(url);
      } else {
        buffer = await createMockBlockImage(input.blockType, input.productName, input.sellingPoints);
      }

      const saved = await saveGeneratedResult({
        userId: input.userId,
        buffer,
        fileName: `detail_${input.detailTaskId}_${input.blockType.toLowerCase()}.png`,
      });

      return {
        imageUrl: saved.publicUrl,
        provider: pid,
        prompt,
        mock: result.mock ?? false,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      void modelUsageService.record({
        provider: pid,
        taskType: "detail_page",
        success: false,
        duration: Date.now() - started,
        taskId: input.detailTaskId,
        userId: input.userId,
        cost: 0,
      });
    }
  }

  const buffer = await createMockBlockImage(input.blockType, input.productName, input.sellingPoints);
  const saved = await saveGeneratedResult({
    userId: input.userId,
    buffer,
    fileName: `detail_${input.detailTaskId}_${input.blockType.toLowerCase()}_fallback.png`,
  });

  if (lastError) {
    console.warn(`[DetailBlock] fallback mock after error: ${lastError.message}`);
  }

  return {
    imageUrl: saved.publicUrl,
    provider: providerId,
    prompt,
    mock: true,
  };
}

async function createMockBlockImage(
  blockType: DetailBlockType,
  productName: string,
  sellingPoints: string[]
): Promise<Buffer> {
  const sharp = await loadSharp();
  const width = 790;
  const height = 420;
  const label = blockType.replace(/_/g, " ");
  const points = sellingPoints.slice(0, 3).join(" · ");
  const svg = `
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e0e7ff"/>
          <stop offset="100%" style="stop-color:#f8fafc"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <text x="40" y="60" font-family="Arial,sans-serif" font-size="22" fill="#6366f1">${label}</text>
      <text x="40" y="110" font-family="Arial,sans-serif" font-size="32" font-weight="bold" fill="#0f172a">${escapeXml(productName)}</text>
      <text x="40" y="160" font-family="Arial,sans-serif" font-size="20" fill="#475569">${escapeXml(points)}</text>
    </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
