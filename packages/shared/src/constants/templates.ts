import { UserPlan } from "../enums";

export const TEMPLATE_CATEGORIES = [
  "厨房用品",
  "家居用品",
  "美妆护肤",
  "服装鞋包",
  "宠物用品",
  "母婴用品",
  "节日营销",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const TEMPLATE_VARIABLES = [
  "product",
  "style",
  "scene",
  "color",
  "festival",
] as const;

export type TemplateVariableKey = (typeof TEMPLATE_VARIABLES)[number];

/** 模板权限：FREE 仅基础；VIP 含高级；ENTERPRISE 全部 */
export function canAccessTemplate(
  effectivePlan: UserPlan,
  template: { isVip: boolean; enabled: boolean }
): boolean {
  if (!template.enabled) return false;
  if (effectivePlan === UserPlan.ENTERPRISE || effectivePlan === UserPlan.VIP) return true;
  return !template.isVip;
}
