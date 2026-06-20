import { getGPTClient } from "@acs/ai-providers";

export interface GPTImageResult {
  url?: string | null;
  buffer?: Buffer;
  revisedPrompt?: string;
}

export async function generateGPTImage(prompt: string): Promise<GPTImageResult> {
  const client = getGPTClient();
  const result = await client.generate({ prompt });

  if (!result.buffers.length) {
    throw new Error("生成失败");
  }

  return {
    buffer: result.buffers[0],
    revisedPrompt: result.revisedPrompt,
  };
}
