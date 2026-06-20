import { AIProviderId } from "@acs/shared";
import { getAIProvider } from "@acs/ai-providers";
import type { AIProvider } from "../types";

export class SeedreamProvider implements AIProvider {
  async generate(prompt: string, inputUrl?: string) {
    const provider = getAIProvider(AIProviderId.SEEDREAM);
    const output = await provider.generate({
      prompt,
      referenceUrls: inputUrl ? [inputUrl] : undefined,
    });

    if (output.buffers?.[0]) {
      return { buffer: output.buffers[0], mock: output.mock };
    }
    if (output.urls[0]) {
      return { url: output.urls[0], mock: output.mock };
    }

    throw new Error("生成失败");
  }
}
