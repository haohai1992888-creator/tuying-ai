import type { AIProvider } from "./types";
import { GPTProvider } from "./gpt/provider";
import { SeedreamProvider } from "./seedream/provider";
import { GeminiProvider } from "./gemini/provider";

const providers: Record<string, AIProvider> = {
  gpt: new GPTProvider(),
  seedream: new SeedreamProvider(),
  gemini: new GeminiProvider(),
};

export function getProvider(model?: string | null): AIProvider {
  const key = (model ?? "gpt").toLowerCase();
  return providers[key] ?? providers.gpt;
}

export function normalizeModel(model?: string | null): string {
  const key = (model ?? "auto").toLowerCase();
  if (key === "auto") return "auto";
  return key in providers ? key : "gpt";
}
