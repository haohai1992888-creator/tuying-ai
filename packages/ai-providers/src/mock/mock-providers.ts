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

abstract class MockAIProvider implements AIProvider {
  abstract readonly id: AIProviderId;

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    return {
      urls: [`mock://${this.id}/generate/${Date.now()}.png`],
      provider: this.id,
      mock: true,
    };
  }

  async edit(input: EditInput): Promise<EditOutput> {
    return { url: input.imageUrl, provider: this.id, mock: true };
  }

  async batchGenerate(input: BatchGenerateInput): Promise<BatchGenerateOutput> {
    const results = await Promise.all(input.items.map((item) => this.generate(item)));
    return { results };
  }
}

export class MockSeedreamProvider extends MockAIProvider {
  readonly id = AIProviderId.SEEDREAM;
}

export class MockGeminiProvider extends MockAIProvider {
  readonly id = AIProviderId.GEMINI;
}
