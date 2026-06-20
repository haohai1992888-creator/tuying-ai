import { extractSellingPoints } from "@acs/detail";
import { buildSellingPointPrompt } from "../prompts/sellingPoint";

function parseSellingLines(text: string): string[] {
  return text
    .split(/\n/)
    .map((line) => line.replace(/^[\d、.·\-\s]+/, "").trim())
    .filter((line) => line.length >= 2 && line.length <= 40)
    .slice(0, 8);
}

export async function generateSellingPoints(input: {
  productName: string;
  userPoints?: string[];
}): Promise<string[]> {
  if (input.userPoints?.length) {
    return input.userPoints.filter(Boolean).slice(0, 8);
  }

  const prompt = buildSellingPointPrompt(input.productName);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const baseUrl = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");

  if (apiKey) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });

      if (res.ok) {
        const json = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = json.choices?.[0]?.message?.content ?? "";
        const parsed = parseSellingLines(content);
        if (parsed.length >= 2) return parsed;
      }
    } catch (error) {
      console.warn("[generateSellingPoints] OpenAI fallback:", error);
    }
  }

  return extractSellingPoints({ productName: input.productName });
}
