import {
  getSceneTemplate,
  interpolate,
  WHITE_BG_TEMPLATES,
  type TemplateVars,
} from "../../prompt_templates/scene/index";

export interface ScenePromptInput {
  category?: string;
  style?: string;
  styleKey?: string;
  locale?: string;
}

export class ScenePromptBuilder {
  build(input: ScenePromptInput): { prompt: string; negativePrompt: string } {
    const locale = input.locale ?? "zh";
    const styleKey = input.styleKey ?? mapStyleToKey(input.style);
    const template = getSceneTemplate(styleKey, locale);
    const vars: TemplateVars = {
      category: input.category?.trim() || "商品",
      style: input.style?.trim() || "现代办公",
    };
    return {
      prompt: interpolate(template, vars),
      negativePrompt: "blurry, low quality, watermark, distorted product, extra limbs",
    };
  }
}

function mapStyleToKey(style?: string): string {
  if (!style) return "default";
  if (style.includes("办公") || style.includes("office")) return "office";
  if (style.includes("家") || style.includes("home")) return "home";
  if (style.includes("户外") || style.includes("outdoor")) return "outdoor";
  return "default";
}

export function buildWhiteBgPrompt(input: ScenePromptInput): string {
  const locale = input.locale ?? "zh";
  const template = WHITE_BG_TEMPLATES[locale] ?? WHITE_BG_TEMPLATES.zh;
  return interpolate(template, { category: input.category ?? "商品" });
}

export const scenePromptBuilder = new ScenePromptBuilder();
