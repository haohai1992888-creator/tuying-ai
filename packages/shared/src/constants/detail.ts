/** 详情页模板分类 — Phase 13 */
export const DETAIL_CATEGORIES = [
  "厨房用品",
  "家居用品",
  "服装",
  "美妆",
  "宠物",
] as const;

export type DetailCategory = (typeof DETAIL_CATEGORIES)[number];

/** 详情页模块类型 */
export enum DetailBlockType {
  BANNER = "BANNER",
  FEATURE = "FEATURE",
  SIZE = "SIZE",
  DETAIL = "DETAIL",
  SCENE = "SCENE",
  PARAMETER = "PARAMETER",
  BRAND = "BRAND",
  REASON = "REASON",
}

/** 电商平台详情页宽度（px） */
export const DETAIL_PLATFORM_WIDTH: Record<string, number> = {
  TAOBAO: 790,
  PINDUODUO: 750,
  DOUYIN: 750,
  XIAOHONGSHU: 750,
  OZON: 800,
  AMAZON: 970,
};

export const DETAIL_BLOCK_LABELS: Record<DetailBlockType, string> = {
  [DetailBlockType.BANNER]: "Banner",
  [DetailBlockType.FEATURE]: "卖点",
  [DetailBlockType.SIZE]: "尺寸",
  [DetailBlockType.DETAIL]: "细节",
  [DetailBlockType.SCENE]: "场景",
  [DetailBlockType.PARAMETER]: "参数",
  [DetailBlockType.BRAND]: "品牌",
  [DetailBlockType.REASON]: "购买理由",
};

/** 默认模块顺序 */
export const DEFAULT_DETAIL_BLOCKS: DetailBlockType[] = [
  DetailBlockType.BANNER,
  DetailBlockType.FEATURE,
  DetailBlockType.SCENE,
  DetailBlockType.SIZE,
  DetailBlockType.PARAMETER,
  DetailBlockType.DETAIL,
  DetailBlockType.BRAND,
  DetailBlockType.REASON,
];

/** 场景/营销模块 — GPT vs Seedream */
export const DETAIL_BLOCK_PROVIDER: Partial<Record<DetailBlockType, "gpt" | "seedream">> = {
  [DetailBlockType.BANNER]: "seedream",
  [DetailBlockType.FEATURE]: "seedream",
  [DetailBlockType.SCENE]: "gpt",
  [DetailBlockType.SIZE]: "gpt",
  [DetailBlockType.PARAMETER]: "gpt",
  [DetailBlockType.DETAIL]: "seedream",
  [DetailBlockType.BRAND]: "seedream",
  [DetailBlockType.REASON]: "seedream",
};
