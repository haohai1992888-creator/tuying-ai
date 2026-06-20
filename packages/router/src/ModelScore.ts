import { AIProviderId } from "@acs/shared";
import type { ModelScoreMap } from "@acs/shared";

/** 模型评分 — quality / speed / cost (1-10) */
export const MODEL_SCORES: ModelScoreMap = {
  [AIProviderId.GPT]: { quality: 10, speed: 7, cost: 5 },
  [AIProviderId.SEEDREAM]: { quality: 9, speed: 8, cost: 6 },
  [AIProviderId.GEMINI]: { quality: 7, speed: 9, cost: 9 },
};

export function getModelScore(provider: AIProviderId) {
  return MODEL_SCORES[provider] ?? { quality: 5, speed: 5, cost: 5 };
}
