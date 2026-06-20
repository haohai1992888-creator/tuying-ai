import type { SellingPointExtractInput } from "./types";

/** 产品名称 → 卖点关键词映射（mock AI 提取） */
const PRODUCT_SELLING_MAP: Record<string, string[]> = {
  厨房刀架: ["免打孔", "加厚材质", "防锈", "大容量"],
  刀架: ["免打孔", "加厚材质", "防锈", "大容量"],
  保温杯: ["保温24小时", "316不锈钢", "防漏设计", "便携"],
  化妆镜: ["高清镜面", "LED补光", "三档亮度", "USB充电"],
  宠物窝: ["柔软舒适", "可拆洗", "防滑底部", "四季通用"],
  连衣裙: ["透气面料", "修身剪裁", "多色可选", "易打理"],
};

const CATEGORY_DEFAULTS: Record<string, string[]> = {
  厨房用品: ["耐用材质", "易清洁", "节省空间", "安全设计"],
  家居用品: ["简约设计", "环保材质", "多功能", "舒适体验"],
  服装: ["优质面料", "时尚版型", "舒适透气", "多色可选"],
  美妆: ["温和配方", "持久效果", "适合敏感肌", "便携设计"],
  宠物: ["安全无毒", "易清洗", "舒适耐用", "宠物喜爱"],
};

/**
 * AI 卖点提取 — 输入产品名称，输出卖点列表
 * 优先用户输入 → OCR → 产品名映射 → 类别默认
 */
export function extractSellingPoints(input: SellingPointExtractInput): string[] {
  if (input.userPoints?.length) {
    return input.userPoints.filter(Boolean).slice(0, 8);
  }

  const name = input.productName.trim();
  if (!name) return ["品质保证", "热销爆款", "限时优惠"];

  for (const [key, points] of Object.entries(PRODUCT_SELLING_MAP)) {
    if (name.includes(key)) return [...points];
  }

  if (input.ocrText) {
    const fromOcr = input.ocrText
      .split(/[,，、\n|]/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2 && s.length <= 12);
    if (fromOcr.length >= 2) return fromOcr.slice(0, 6);
  }

  for (const [cat, points] of Object.entries(CATEGORY_DEFAULTS)) {
    if (name.includes(cat)) return [...points];
  }

  return ["高品质", "热销爆款", "限时优惠", "售后无忧"];
}
