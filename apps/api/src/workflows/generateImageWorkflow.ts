import { getProvider } from "../providers/providerFactory";
import { downloadImage } from "../storage/download";
import { saveGeneratedImage } from "../storage/saveGenerated";
import { getFallbackChain } from "../router/fallback";
import { logModelCall } from "../analytics/model";

async function generateImageOnce(
  prompt: string,
  model: string,
  userId: string,
  inputUrl?: string | null
): Promise<string> {
  const provider = getProvider(model);
  const image = await provider.generate(prompt, inputUrl ?? undefined);

  if (image.mock && image.url?.startsWith("mock://")) {
    return image.url;
  }

  let buffer: Buffer;
  if (image.buffer) {
    buffer = image.buffer;
  } else if (image.url) {
    buffer = await downloadImage(image.url);
  } else {
    throw new Error("生成失败");
  }

  return saveGeneratedImage(buffer, userId);
}

export async function generateImage(
  prompt: string,
  model: string,
  userId: string,
  inputUrl?: string | null,
  context?: { taskId: string; taskType: string }
): Promise<{ result: string; model: string }> {
  const chain = getFallbackChain(model);
  let lastError: Error | null = null;

  for (const candidate of chain) {
    const started = Date.now();
    try {
      const result = await generateImageOnce(prompt, candidate, userId, inputUrl);

      if (context) {
        await logModelCall({
          model: candidate,
          taskId: context.taskId,
          userId,
          taskType: context.taskType,
          success: true,
          durationMs: Date.now() - started,
        });
      }

      return { result, model: candidate };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[generateImage] ${candidate} failed:`, lastError.message);

      if (context) {
        await logModelCall({
          model: candidate,
          taskId: context.taskId,
          userId,
          taskType: context.taskType,
          success: false,
          durationMs: Date.now() - started,
        });
      }
    }
  }

  throw lastError ?? new Error("生成失败");
}
