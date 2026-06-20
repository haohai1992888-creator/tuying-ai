export * from "./types";
export * from "./gpt/GPTProvider";
export * from "./gpt/GPTClient";
export * from "./gpt/GPTTypes";
export * from "./seedream/SeedreamProvider";
export * from "./seedream/SeedreamClient";
export * from "./seedream/SeedreamTypes";
export * from "./gemini/GeminiProvider";
export * from "./gemini/GeminiClient";
export * from "./gemini/GeminiTypes";
export * from "./mock/mock-providers";
export * from "./prompts/ScenePromptBuilder";
export * from "./prompts/PosterPromptBuilder";
export * from "./prompts/ModelPromptBuilder";

export { POSTER_TEMPLATE_OPTIONS } from "../prompt_templates/poster/index";
export { MODEL_TEMPLATE_OPTIONS } from "../prompt_templates/model/index";

import { AIProviderId } from "@acs/shared";
import type { AIProvider } from "./types";
import { GPTProvider } from "./gpt/GPTProvider";
import { SeedreamProvider } from "./seedream/SeedreamProvider";
import { GeminiProvider } from "./gemini/GeminiProvider";
import { isGeminiConfigured } from "./gemini/GeminiClient";
import { MockGeminiProvider } from "./mock/mock-providers";

const gptProvider = new GPTProvider();
const seedreamProvider = new SeedreamProvider();
const geminiProvider = isGeminiConfigured() ? new GeminiProvider() : new MockGeminiProvider();

const registry: Record<AIProviderId, AIProvider> = {
  [AIProviderId.GPT]: gptProvider,
  [AIProviderId.SEEDREAM]: seedreamProvider,
  [AIProviderId.GEMINI]: geminiProvider,
};

export function getAIProvider(id: AIProviderId): AIProvider {
  return registry[id];
}

export { GPTProvider, SeedreamProvider, GeminiProvider, MockGeminiProvider };
