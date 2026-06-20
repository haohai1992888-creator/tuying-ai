/** 海报 Prompt 模板 — 支持变量替换、风格切换、营销文案 */

export const POSTER_STYLE_TEMPLATES: Record<string, Record<string, string>> = {
  zh: {
    "618": "为{category}设计618大促海报，突出「{sellingPoints}」，红色促销氛围，大字标题，限时抢购视觉，电商爆款风格。",
    new_product: "为{category}设计新品上市海报，强调「{sellingPoints}」，清新高端，新品标签，品牌感强，商业广告级排版。",
    discount: "为{category}设计限时折扣海报，核心卖点「{sellingPoints}」，紧迫感倒计时元素，折扣标签醒目，转化导向设计。",
    buy_one_get_one: "为{category}设计买一送一促销海报，突出「{sellingPoints}」，赠品对比展示，活动规则清晰，电商大促风格。",
    brand: "为{category}设计品牌宣传海报，传递「{sellingPoints}」，简约高级，品牌调性一致，商业广告级质感。",
    default: "为{category}设计{style}风格促销海报，卖点「{sellingPoints}」，视觉冲击力强，商业广告级排版。",
  },
  en: {
    "618": "Design a 618 sale poster for {category}, highlight '{sellingPoints}', bold promo style, e-commerce conversion layout.",
    new_product: "Design a new product launch poster for {category}, emphasize '{sellingPoints}', premium clean layout.",
    discount: "Design a limited-time discount poster for {category}, core selling point '{sellingPoints}', urgency-driven promo design.",
    buy_one_get_one: "Design a buy-one-get-one poster for {category}, highlight '{sellingPoints}', gift comparison layout.",
    brand: "Design a brand campaign poster for {category}, convey '{sellingPoints}', minimal premium commercial style.",
    default: "Design a {style} promotional poster for {category}, selling points '{sellingPoints}', high visual impact.",
  },
};

export const POSTER_TEMPLATE_OPTIONS = [
  { key: "618", label: "618促销" },
  { key: "new_product", label: "新品上市" },
  { key: "discount", label: "限时折扣" },
  { key: "buy_one_get_one", label: "买一送一" },
  { key: "brand", label: "品牌宣传" },
] as const;

export function interpolate(template: string, vars: Record<string, string | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key]?.trim() || "");
}

export function getPosterTemplate(templateKey: string, locale = "zh"): string {
  const templates = POSTER_STYLE_TEMPLATES[locale] ?? POSTER_STYLE_TEMPLATES.zh;
  return templates[templateKey] ?? templates.default;
}
