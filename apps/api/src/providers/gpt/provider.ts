import { AIProviderId } from "@acs/shared";
import { getAIProvider } from "@acs/ai-providers";
import type { AIProvider } from "../types";
import { generateGPTImage } from "../gptImage";

export class GPTProvider implements AIProvider {
  async generate(prompt: string, inputUrl?: string) {
    if (inputUrl) {
      const provider = getAIProvider(AIProviderId.GPT);
      const output = await provider.generate({ prompt, referenceUrls: [inputUrl] });
      return resolveOutput(output);
    }

    const result = await generateGPTImage(prompt);
    return {
      buffer: result.buffer,
      url: result.url ?? undefined,
    };
  }
}

async function resolveOutput(output: {
  urls: string[];
  buffers?: Buffer[];
  mock?: boolean;
}): Promise<{ url?: string; buffer?: Buffer; mock?: boolean }> {
  if (output.buffers?.[0]) {
    return { buffer: output.buffers[0], mock: output.mock };
  }
  if (output.urls[0]) {
    return { url: output.urls[0], mock: output.mock };
  }
  throw new Error("生成失败");
}
