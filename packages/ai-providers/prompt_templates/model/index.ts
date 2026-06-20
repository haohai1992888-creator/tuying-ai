/** 模特图 Prompt 模板 — 支持品类风格切换 */

export const MODEL_STYLE_TEMPLATES: Record<string, Record<string, string>> = {
  zh: {
    womenswear: "时尚女模特展示{category}，{style}女装电商摄影，自然姿态，柔和布光，商品细节清晰，小红书/淘宝主图品质。",
    menswear: "型男模特展示{category}，{style}男装电商摄影，自信姿态，都市背景，商品主体突出，商业广告级质感。",
    kidswear: "儿童模特展示{category}，{style}童装电商摄影，活泼自然，明亮色调，安全温馨氛围，商品清晰可辨。",
    shoes_bags: "模特展示{category}鞋包配饰，{style}时尚电商摄影，全身/半身构图，质感细节，高端电商风格。",
    accessories: "模特佩戴/展示{category}饰品，{style}精致电商摄影，特写与半身结合，光泽质感，商业广告级。",
    default: "模特展示{category}，{style}风格，时尚电商摄影，自然姿态，商品主体一致。",
  },
  en: {
    womenswear: "Fashion female model showcasing {category}, {style} womenswear e-commerce photography.",
    menswear: "Male model showcasing {category}, {style} menswear commercial photography.",
    kidswear: "Child model showcasing {category}, {style} kidswear bright e-commerce photography.",
    shoes_bags: "Model showcasing {category} shoes/bags, {style} fashion e-commerce photography.",
    accessories: "Model showcasing {category} accessories, {style} refined commercial photography.",
    default: "Model showcasing {category}, {style} style, fashion e-commerce photography.",
  },
};

export const MODEL_TEMPLATE_OPTIONS = [
  { key: "womenswear", label: "女装" },
  { key: "menswear", label: "男装" },
  { key: "kidswear", label: "童装" },
  { key: "shoes_bags", label: "鞋包" },
  { key: "accessories", label: "饰品" },
] as const;

export function interpolate(template: string, vars: Record<string, string | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key]?.trim() || "");
}

export function getModelTemplate(templateKey: string, locale = "zh"): string {
  const templates = MODEL_STYLE_TEMPLATES[locale] ?? MODEL_STYLE_TEMPLATES.zh;
  return templates[templateKey] ?? templates.default;
}
