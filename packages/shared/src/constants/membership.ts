import { UserPlan } from "../enums";

export interface PlanBenefits {
  label: string;
  priceMonthly: number;
  giftPoints: number;
  dailySignInPoints: number;
  maxConcurrency: number;
  routerPriority: string;
  features: string[];
}

export const PLAN_BENEFITS: Record<UserPlan, PlanBenefits> = {
  [UserPlan.FREE]: {
    label: "免费版",
    priceMonthly: 0,
    giftPoints: 100,
    dailySignInPoints: 5,
    maxConcurrency: 3,
    routerPriority: "Gemini 成本优先",
    features: ["注册送 100 积分", "每日签到 +5 积分", "最大并发 3", "基础 AI 功能"],
  },
  [UserPlan.VIP]: {
    label: "VIP 版",
    priceMonthly: 29,
    giftPoints: 1000,
    dailySignInPoints: 20,
    maxConcurrency: 10,
    routerPriority: "GPT 优先",
    features: ["开通赠 1000 积分", "每日签到 +20 积分", "最大并发 10", "GPT 优先", "高级模板"],
  },
  [UserPlan.ENTERPRISE]: {
    label: "企业版",
    priceMonthly: 99,
    giftPoints: 5000,
    dailySignInPoints: 50,
    maxConcurrency: 30,
    routerPriority: "质量最高优先",
    features: ["开通赠 5000 积分", "每日签到 +50 积分", "最大并发 30", "最高优先级", "批量生成增强"],
  },
};

export function resolveEffectivePlan(input: {
  plan?: string | null;
  vipExpireAt?: Date | string | null;
  role?: string | null;
}): UserPlan {
  if (input.role === "ADMIN") return UserPlan.ENTERPRISE;
  const expire =
    input.vipExpireAt instanceof Date
      ? input.vipExpireAt
      : input.vipExpireAt
        ? new Date(input.vipExpireAt)
        : null;
  if (!expire || expire <= new Date()) return UserPlan.FREE;
  const plan = (input.plan ?? UserPlan.FREE) as UserPlan;
  if (plan === UserPlan.VIP || plan === UserPlan.ENTERPRISE) return plan;
  return UserPlan.VIP;
}

export function planToUserLevel(plan: UserPlan): string {
  switch (plan) {
    case UserPlan.ENTERPRISE:
      return "enterprise";
    case UserPlan.VIP:
      return "vip";
    default:
      return "free";
  }
}
