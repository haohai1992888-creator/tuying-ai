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
import { getGPTClient } from "./GPTClient";
import {
  mapEditOutput,
  mapGenerateInput,
  mapGenerateOutput,
  resolveReferenceImage,
} from "./GPTMapper";

/** GPT Image Provider — Phase 5 真实 OpenAI 接入 */
export class GPTProvider implements AIProvider {
  readonly id = AIProviderId.GPT;

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const reference = await resolveReferenceImage(input);
    const client = getGPTClient();
    const request = mapGenerateInput({
      ...input,
      referenceBuffer: reference?.buffer,
      referenceMime: reference?.mime,
    });
    const response = await client.generate(request);
    return mapGenerateOutput(response);
  }

  async edit(input: EditInput): Promise<EditOutput> {
    let buffer = input.imageBuffer;
    let mime = input.imageMime ?? "image/png";

    if (!buffer && input.imageUrl) {
      const res = await fetch(input.imageUrl);
      if (!res.ok) throw new Error("无法读取待编辑图片");
      buffer = Buffer.from(await res.arrayBuffer());
      mime = res.headers.get("content-type") ?? mime;
    }
    if (!buffer) throw new Error("缺少图片数据");

    const client = getGPTClient();
    const response = await client.edit({
      prompt: input.prompt,
      image: buffer,
      imageMime: mime,
    });
    return mapEditOutput(response);
  }

  async batchGenerate(input: BatchGenerateInput): Promise<BatchGenerateOutput> {
    const results = await Promise.all(input.items.map((item) => this.generate(item)));
    return { results };
  }
}
