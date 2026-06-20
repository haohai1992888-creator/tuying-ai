import type { GenerateInput } from "../types";
import type { SeedreamGenerateRequest, SeedreamGenerateResponse } from "./SeedreamTypes";

export function mapGenerateInput(input: GenerateInput): SeedreamGenerateRequest {
  const refs: Array<{ buffer: Buffer; mime: string }> = [];
  if (input.referenceBuffer) {
    refs.push({ buffer: input.referenceBuffer, mime: input.referenceMime ?? "image/png" });
  }
  return {
    prompt: input.prompt,
    size: input.size ?? "1024x1024",
    referenceImage: input.referenceBuffer,
    referenceMime: input.referenceMime,
    referenceImages: refs.length ? refs : undefined,
  };
}

export function mapGenerateOutput(response: SeedreamGenerateResponse) {
  return {
    urls: [] as string[],
    buffers: response.buffers,
    model: response.model,
    revisedPrompt: response.revisedPrompt,
  };
}

export async function resolveReferenceImages(
  input: GenerateInput
): Promise<Array<{ buffer: Buffer; mime: string }>> {
  const refs: Array<{ buffer: Buffer; mime: string }> = [];

  if (input.referenceBuffer) {
    refs.push({ buffer: input.referenceBuffer, mime: input.referenceMime ?? "image/png" });
  }

  for (const url of input.referenceUrls ?? []) {
    if (!url || url.startsWith("mock://")) continue;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`无法读取参考图片: ${url}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type") ?? "image/png";
    refs.push({ buffer, mime });
  }

  return refs;
}
