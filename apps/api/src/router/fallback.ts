import type { ModelKey } from "../config/models";

export function fallback(model: string): ModelKey {
  const key = model.toLowerCase();

  if (key === "gpt") {
    return "seedream";
  }

  if (key === "seedream") {
    return "gemini";
  }

  return "gemini";
}

export function getFallbackChain(model: string): ModelKey[] {
  const chain: ModelKey[] = [];
  let current = model.toLowerCase() as ModelKey;
  const seen = new Set<string>();

  while (!seen.has(current)) {
    chain.push(current);
    seen.add(current);
    const next = fallback(current);
    if (next === current) break;
    current = next;
  }

  return chain;
}
