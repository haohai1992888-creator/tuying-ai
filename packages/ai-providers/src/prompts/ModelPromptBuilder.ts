import { getModelTemplate, interpolate } from "../../prompt_templates/model/index";

export interface ModelPromptInput {
  category?: string;
  style?: string;
  templateKey?: string;
  locale?: string;
}

export class ModelPromptBuilder {
  build(input: ModelPromptInput): { prompt: string; negativePrompt: string } {
    const locale = input.locale ?? "zh";
    const templateKey = input.templateKey ?? mapStyleToTemplateKey(input.style);
    const template = getModelTemplate(templateKey, locale);

    return {
      prompt: interpolate(template, {
        category: input.category?.trim() || "商品",
        style: input.style?.trim() || "时尚",
      }),
      negativePrompt: "blurry, distorted body, extra limbs, deformed hands, low quality, watermark",
    };
  }
}

function mapStyleToTemplateKey(style?: string): string {
  if (!style) return "default";
  if (style.includes("女")) return "womenswear";
  if (style.includes("男") && !style.includes("女")) return "menswear";
  if (style.includes("童")) return "kidswear";
  if (style.includes("鞋") || style.includes("包")) return "shoes_bags";
  if (style.includes("饰")) return "accessories";
  return "default";
}

export const modelPromptBuilder = new ModelPromptBuilder();

export function buildModelPrompt(input: ModelPromptInput): string {
  return modelPromptBuilder.build(input).prompt;
}
