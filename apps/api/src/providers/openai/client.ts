import OpenAI from "openai";

let cached: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (cached) return cached;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 未配置");
  }

  cached = new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL?.trim() || undefined,
  });

  return cached;
}

/** 与课程文档一致的导出别名 */
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return Reflect.get(getOpenAIClient(), prop);
  },
});
