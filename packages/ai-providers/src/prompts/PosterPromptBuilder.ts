import { getPosterTemplate, interpolate } from "../../prompt_templates/poster/index";

export interface PosterPromptInput {
  category?: string;
  style?: string;
  templateKey?: string;
  sellingPoints?: string;
  locale?: string;
}

export class PosterPromptBuilder {
  build(input: PosterPromptInput): { prompt: string; negativePrompt: string } {
    const locale = input.locale ?? "zh";
    const templateKey = input.templateKey ?? mapStyleToTemplateKey(input.style);
    const template = getPosterTemplate(templateKey, locale);
    const sellingPoints = input.sellingPoints?.trim() || "高品质、热销爆款";

    return {
      prompt: interpolate(template, {
        category: input.category?.trim() || "商品",
        style: input.style?.trim() || "促销",
        sellingPoints,
      }),
      negativePrompt: "blurry, low quality, watermark, messy layout, unreadable text, distorted product",
    };
  }
}

function mapStyleToTemplateKey(style?: string): string {
  if (!style) return "default";
  if (style.includes("618")) return "618";
  if (style.includes("新品")) return "new_product";
  if (style.includes("折扣")) return "discount";
  if (style.includes("买一")) return "buy_one_get_one";
  if (style.includes("品牌")) return "brand";
  return "default";
}

export const posterPromptBuilder = new PosterPromptBuilder();

export function buildPosterPrompt(input: PosterPromptInput): string {
  return posterPromptBuilder.build(input).prompt;
}
