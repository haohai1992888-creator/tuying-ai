import {
  AIProviderId,
  RouterTaskType,
  UserLevel,
  UserPlan,
  UserRole,
  type RouteInput,
  type RouteResult,
} from "@acs/shared";
import { applyCostPolicy } from "./CostPolicy";
import { getFailoverChain } from "./FailoverStrategy";
import { getModelScore, MODEL_SCORES } from "./ModelScore";
import { isValidProvider, normalizeRouterTaskType } from "./normalize";

/** 第一版规则引擎 — 任务类型 → 默认 Provider */
const TASK_RULES: Record<string, { provider: AIProviderId; reason: string }> = {
  [RouterTaskType.SCENE_IMAGE]: { provider: AIProviderId.GPT, reason: "场景图 → GPT Image 2" },
  [RouterTaskType.POSTER_IMAGE]: { provider: AIProviderId.SEEDREAM, reason: "中文海报 → Seedream" },
  [RouterTaskType.MODEL_IMAGE]: { provider: AIProviderId.SEEDREAM, reason: "模特图 → Seedream" },
  [RouterTaskType.WHITE_BG]: { provider: AIProviderId.GEMINI, reason: "白底图 → Gemini Flash Image" },
  [RouterTaskType.BATCH_IMAGE]: { provider: AIProviderId.GEMINI, reason: "批量生成 → Gemini" },
};

function resolveUserLevel(input: RouteInput): UserLevel {
  if (input.userPlan) {
    if (input.userPlan === UserPlan.ENTERPRISE) return UserLevel.ENTERPRISE;
    if (input.userPlan === UserPlan.VIP) return UserLevel.VIP;
    return UserLevel.FREE;
  }
  if (input.userLevel && input.userLevel !== UserLevel.FREE) {
    return input.userLevel as UserLevel;
  }
  if (input.userRole === UserRole.ADMIN) return UserLevel.ENTERPRISE;
  if (input.userRole === UserRole.VIP) return UserLevel.VIP;
  return UserLevel.FREE;
}

function scoreForLevel(provider: AIProviderId, level: UserLevel): number {
  const s = getModelScore(provider);
  switch (level) {
    case UserLevel.ENTERPRISE:
      return s.quality * 3 + s.speed * 0.5;
    case UserLevel.VIP:
    case UserLevel.PRO:
      return s.quality * 2 + s.speed;
    case UserLevel.FREE:
    default:
      return s.cost * 2 + s.speed;
  }
}

function applyUserLevelStrategy(
  baseProvider: AIProviderId,
  level: UserLevel,
  normalizedTask: string
): { provider: AIProviderId; reason: string } {
  const candidates = Object.keys(MODEL_SCORES) as AIProviderId[];
  const rule = TASK_RULES[normalizedTask];

  if (level === UserLevel.ENTERPRISE) {
    const best = candidates.reduce((a, b) => (scoreForLevel(b, level) > scoreForLevel(a, level) ? b : a));
    return { provider: best, reason: `企业版最高质量 → ${best}` };
  }

  if (level === UserLevel.VIP && rule?.provider === AIProviderId.GPT) {
    return { provider: AIProviderId.GPT, reason: "VIP 优先 GPT" };
  }

  if (level === UserLevel.FREE) {
    const best = candidates.reduce((a, b) => (scoreForLevel(b, level) > scoreForLevel(a, level) ? b : a));
    if (best === AIProviderId.GEMINI || best !== baseProvider) {
      return { provider: best, reason: `免费版 Gemini/成本优先 → ${best}` };
    }
  }

  return { provider: baseProvider, reason: rule?.reason ?? "规则引擎默认" };
}

/**
 * RuleBasedRouter — Phase 8 智能模型路由
 */
export class RuleBasedRouter {
  route(input: RouteInput): RouteResult {
    const normalized = String(normalizeRouterTaskType(String(input.taskType)));
    const rule = TASK_RULES[normalized];
    let provider = rule?.provider ?? AIProviderId.GPT;
    let reason = rule?.reason ?? "default";

    const preferred = input.preferredProvider?.trim().toLowerCase();
    if (preferred && preferred !== "auto" && isValidProvider(preferred)) {
      provider = preferred;
      reason = `用户指定 Provider: ${preferred}`;
    } else {
      const level = resolveUserLevel(input);
      const levelResult = applyUserLevelStrategy(provider, level, normalized);
      provider = levelResult.provider;
      reason = `${reason}; ${levelResult.reason}`;
    }

    const balance = input.userBalance ?? 9999;
    const taskCost = input.taskCost ?? 1;
    const costResult = applyCostPolicy(provider, balance, taskCost);
    if (costResult.provider !== provider) {
      provider = costResult.provider;
      reason = `${reason}; ${costResult.reason}`;
    }

    return {
      provider,
      reason,
      fallbackChain: getFailoverChain(provider),
      score: scoreForLevel(provider, resolveUserLevel(input)),
    };
  }
}

export const ruleBasedRouter = new RuleBasedRouter();

/** @deprecated 兼容旧引用 */
export class ModelRouter extends RuleBasedRouter {}
export const modelRouter = ruleBasedRouter;
