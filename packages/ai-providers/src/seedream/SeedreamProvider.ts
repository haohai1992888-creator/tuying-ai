import { AIProviderId } from "@acs/shared";
import type {
  AIProvider,
  BatchGenerateInput,
  BatchGenerateOutput,
  EditInput,
  EditOutput,
  GenerateInput,
  GenerateOutput,
} from "../types";
import { getSeedreamClient, isSeedreamConfigured } from "./SeedreamClient";
import {
  mapGenerateInput,
  mapGenerateOutput,
  resolveReferenceImages,
} from "./SeedreamMapper";

/** Seedream Provider — Phase 7 真实 Seedream / ModelArk 接入 */
export class SeedreamProvider implements AIProvider {
  readonly id = AIProviderId.SEEDREAM;

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const refs = await resolveReferenceImages(input);

    if (!isSeedreamConfigured()) {
      return this.mockGenerate(refs.length > 0);
    }

    const client = getSeedreamClient();
    const request = mapGenerateInput({
      ...input,
      referenceBuffer: refs[0]?.buffer,
      referenceMime: refs[0]?.mime,
    });
    request.referenceImages = refs;

    const response = await client.generate(request);
    return {
      ...mapGenerateOutput(response),
      provider: AIProviderId.SEEDREAM,
      mock: false,
    };
  }

  async edit(input: EditInput): Promise<EditOutput> {
    if (!isSeedreamConfigured()) {
      return { url: input.imageUrl, provider: AIProviderId.SEEDREAM, mock: true };
    }

    let buffer = input.imageBuffer;
    let mime = input.imageMime ?? "image/png";
    if (!buffer && input.imageUrl) {
      const res = await fetch(input.imageUrl);
      if (!res.ok) throw new Error("无法读取待编辑图片");
      buffer = Buffer.from(await res.arrayBuffer());
      mime = res.headers.get("content-type") ?? mime;
    }
    if (!buffer) throw new Error("缺少图片数据");

    const client = getSeedreamClient();
    const response = await client.edit({ prompt: input.prompt, image: buffer, imageMime: mime });
    return {
      url: "",
      buffer: response.buffers[0],
      provider: AIProviderId.SEEDREAM,
      model: response.model,
      mock: false,
    };
  }

  async batchGenerate(input: BatchGenerateInput): Promise<BatchGenerateOutput> {
    const results = await Promise.all(input.items.map((item) => this.generate(item)));
    return { results };
  }

  private mockGenerate(hasReference: boolean): GenerateOutput {
    return {
      urls: [`mock://seedream/${hasReference ? "i2i" : "t2i"}/${Date.now()}.png`],
      provider: AIProviderId.SEEDREAM,
      model: "seedream-mock",
      mock: true,
    };
  }
}
