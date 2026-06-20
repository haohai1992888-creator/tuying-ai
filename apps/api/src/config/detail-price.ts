export const DETAIL_PRICING = {
  sellingPoints: 5,
  fiveImages: 20,
  fullPage: 50,
} as const;

export const FIVE_IMAGE_BLOCKS = ["BANNER", "FEATURE", "SCENE", "PARAMETER", "REASON"] as const;

export const MODULE_TYPE_MAP: Record<string, string> = {
  BANNER: "hero",
  FEATURE: "selling",
  SCENE: "scene",
  SIZE: "size",
  PARAMETER: "params",
  DETAIL: "usage",
  BRAND: "brand",
  REASON: "reason",
};

export const MODULE_TITLES: Record<string, string> = {
  hero: "首屏海报",
  selling: "产品卖点",
  scene: "真实使用场景",
  size: "尺寸规格",
  params: "参数展示",
  usage: "使用说明",
  brand: "品牌信任",
  reason: "购买理由",
};
