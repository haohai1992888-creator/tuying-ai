/** Phase 10 模板市场分类（课程定义 + 与存量分类兼容） */
export const CATEGORY = [
  "厨房场景",
  "家居场景",
  "服饰模特",
  "食品摄影",
  "详情页",
  "海报",
  "短视频",
  "厨房用品",
  "家居用品",
  "美妆护肤",
  "服装鞋包",
  "宠物用品",
  "母婴用品",
  "节日营销",
] as const;

export type TemplateCategory = (typeof CATEGORY)[number];
