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
import { getGeminiClient, isGeminiConfigured } from "./GeminiClient";

/** Gemini Flash Image Provider — Phase 6 真实接入 */
export class GeminiProvider implements AIProvider {
  readonly id = AIProviderId.GEMINI;

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    if (!isGeminiConfigured()) {
      return {
        urls: [`mock://gemini/generate/${Date.now()}.png`],
        provider: AIProviderId.GEMINI,
        model: "gemini-mock",
        mock: true,
      };
    }

    const client = getGeminiClient();
    const response = await client.generate({ prompt: input.prompt, size: input.size ?? "1024x1024" });

    return {
      urls: [],
      buffers: response.buffers,
      provider: AIProviderId.GEMINI,
      model: response.model,
      mock: false,
    };
  }

  async edit(input: EditInput): Promise<EditOutput> {
    if (!isGeminiConfigured()) {
      return { url: input.imageUrl, provider: AIProviderId.GEMINI, mock: true };
    }

    const client = getGeminiClient();
    const response = await client.generate({
      prompt: `${input.prompt}\n\nEdit the provided reference image.`,
    });

    return {
      url: "",
      buffer: response.buffers[0],
      provider: AIProviderId.GEMINI,
      model: response.model,
      mock: false,
    };
  }

  async batchGenerate(input: BatchGenerateInput): Promise<BatchGenerateOutput> {
    const results = await Promise.all(input.items.map((item) => this.generate(item)));
    return { results };
  }
}
