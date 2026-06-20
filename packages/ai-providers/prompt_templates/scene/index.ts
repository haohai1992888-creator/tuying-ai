/** 场景图 Prompt 模板 — 支持变量替换与多语言 */

export const SCENE_TEMPLATES: Record<string, Record<string, string>> = {
  zh: {
    office:
      "将{category}放置于{style}场景，自然光，高端电商摄影风格，保持商品主体一致，真实阴影，商业广告级质量。",
    home: "将{category}置于{style}家居环境中，柔和自然光，温馨生活感，商品细节清晰，电商主图品质。",
    outdoor: "将{category}置于{style}户外场景，明亮日光，清新自然，商品主体突出，专业商业摄影。",
    default:
      "将{category}放置于{style}场景，自然光，高端电商摄影风格，保持商品主体一致，真实阴影，商业广告级质量。",
  },
  en: {
    office:
      "Place the {category} in a {style} setting, natural lighting, premium e-commerce photography, consistent product subject, realistic shadows, commercial ad quality.",
    home: "Place the {category} in a {style} home environment, soft natural light, lifestyle feel, sharp product details.",
    outdoor:
      "Place the {category} in a {style} outdoor scene, bright daylight, fresh and natural, product-focused commercial photography.",
    default:
      "Place the {category} in a {style} setting, natural lighting, premium e-commerce photography, consistent product subject.",
  },
};

export const POSTER_TEMPLATES: Record<string, string> = {
  zh: "为{category}设计{style}风格促销海报，视觉冲击力强，商业广告级排版。",
  en: "Design a {style} promotional poster for {category}, high visual impact, commercial layout.",
};

export const WHITE_BG_TEMPLATES: Record<string, string> = {
  zh: "将{category}抠图并置于纯白背景，边缘干净，电商白底图标准。",
  en: "Extract {category} onto pure white background, clean edges, e-commerce white background standard.",
};

export const MODEL_TEMPLATES: Record<string, string> = {
  zh: "模特展示{category}，{style}风格，时尚电商摄影，自然姿态。",
  en: "Model showcasing {category}, {style} style, fashion e-commerce photography.",
};

export interface TemplateVars {
  category?: string;
  style?: string;
  [key: string]: string | undefined;
}

export function interpolate(template: string, vars: TemplateVars): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key]?.trim() || "");
}

export function getSceneTemplate(styleKey: string, locale = "zh"): string {
  const templates = SCENE_TEMPLATES[locale] ?? SCENE_TEMPLATES.zh;
  return templates[styleKey] ?? templates.default;
}
