import { AIProviderId } from "@acs/shared";
import type { EditInput, EditOutput, GenerateInput, GenerateOutput } from "../types";
import type { GPTGenerateRequest, GPTGenerateResponse } from "./GPTTypes";

export function mapGenerateInput(input: GenerateInput): GPTGenerateRequest {
  return {
    prompt: input.prompt,
    referenceImage: input.referenceBuffer,
    referenceMime: input.referenceMime,
    size: input.size,
  };
}

export function mapGenerateOutput(response: GPTGenerateResponse): GenerateOutput {
  return {
    urls: [],
    buffers: response.buffers,
    provider: AIProviderId.GPT,
    model: response.model,
    mock: false,
    revisedPrompt: response.revisedPrompt,
  };
}

export function mapEditOutput(response: GPTGenerateResponse): EditOutput {
  return {
    url: "",
    buffer: response.buffers[0],
    provider: AIProviderId.GPT,
    model: response.model,
    mock: false,
  };
}

export async function resolveReferenceImage(
  input: GenerateInput
): Promise<{ buffer: Buffer; mime: string } | null> {
  if (input.referenceBuffer) {
    return { buffer: input.referenceBuffer, mime: input.referenceMime ?? "image/png" };
  }
  const url = input.referenceUrls?.[0];
  if (!url) return null;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`无法读取参考图片: ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type") ?? "image/png";
  return { buffer, mime };
}
