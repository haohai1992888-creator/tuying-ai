import { DETAIL_PLATFORM_WIDTH } from "@acs/shared";
import { fetchImageBuffer } from "@acs/files";

export interface ComposeBlockInput {
  imageUrl: string;
  blockType: string;
}

export interface ComposeInput {
  blocks: ComposeBlockInput[];
  platform?: string;
  productName?: string;
}

export interface ComposeResult {
  buffer: Buffer;
  width: number;
  height: number;
}

async function loadSharp() {
  const mod = await import("sharp");
  return mod.default;
}

/** 790px 宽长图拼接 — 支持淘宝/拼多多/抖店等平台尺寸 */
export async function composeDetailLongImage(input: ComposeInput): Promise<ComposeResult> {
  const platform = input.platform ?? "TAOBAO";
  const targetWidth = DETAIL_PLATFORM_WIDTH[platform] ?? 790;
  const sharp = await loadSharp();

  const resizedBlocks: Buffer[] = [];

  for (const block of input.blocks) {
    if (!block.imageUrl) continue;
    try {
      let buffer: Buffer;
      if (block.imageUrl.startsWith("data:")) {
        buffer = await fetchImageBuffer(block.imageUrl);
      } else {
        buffer = await fetchImageBuffer(block.imageUrl);
      }
      const resized = await sharp(buffer)
        .resize({ width: targetWidth, fit: "inside", withoutEnlargement: false })
        .png()
        .toBuffer();
      resizedBlocks.push(resized);
    } catch {
      const placeholder = await createPlaceholderBlock(sharp, targetWidth, block.blockType);
      resizedBlocks.push(placeholder);
    }
  }

  if (resizedBlocks.length === 0) {
    const empty = await createPlaceholderBlock(sharp, targetWidth, "详情页");
    resizedBlocks.push(empty);
  }

  const metas = await Promise.all(resizedBlocks.map((b) => sharp(b).metadata()));
  const totalHeight = metas.reduce((sum, m) => sum + (m.height ?? 400), 0);

  let y = 0;
  const composites: { input: Buffer; top: number; left: number }[] = [];
  for (let i = 0; i < resizedBlocks.length; i++) {
    composites.push({ input: resizedBlocks[i], top: y, left: 0 });
    y += metas[i].height ?? 400;
  }

  const canvas = await sharp({
    create: {
      width: targetWidth,
      height: totalHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  return { buffer: canvas, width: targetWidth, height: totalHeight };
}

async function createPlaceholderBlock(
  sharp: Awaited<ReturnType<typeof loadSharp>>,
  width: number,
  label: string
): Promise<Buffer> {
  const height = 400;
  const svg = `
    <svg width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#f1f5f9"/>
      <text x="50%" y="50%" font-family="Arial,sans-serif" font-size="28" fill="#334155"
        text-anchor="middle" dominant-baseline="middle">${escapeXml(label)}</text>
    </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
