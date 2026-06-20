export const MODELS = {
  GPT: {
    key: "gpt",
    cost: 10,
    quality: 10,
    speed: 7,
  },
  SEEDREAM: {
    key: "seedream",
    cost: 4,
    quality: 8,
    speed: 9,
  },
  GEMINI: {
    key: "gemini",
    cost: 2,
    quality: 6,
    speed: 10,
  },
} as const;

export type ModelKey = (typeof MODELS)[keyof typeof MODELS]["key"];

export function getModelCost(model: string): number {
  const entry = Object.values(MODELS).find((m) => m.key === model.toLowerCase());
  return entry?.cost ?? MODELS.GEMINI.cost;
}

export function getModelConfig(model: string) {
  return Object.values(MODELS).find((m) => m.key === model.toLowerCase()) ?? MODELS.GEMINI;
}
