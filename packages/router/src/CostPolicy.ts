import { AIProviderId } from "@acs/shared";

/** 成本降级链：GPT → Seedream → Gemini */
export const COST_DOWNGRADE_CHAIN: AIProviderId[] = [
  AIProviderId.GPT,
  AIProviderId.SEEDREAM,
  AIProviderId.GEMINI,
];

/** 各 Provider 建议最低积分余额（成本控制） */
export const PROVIDER_BALANCE_THRESHOLD: Record<AIProviderId, number> = {
  [AIProviderId.GPT]: 15,
  [AIProviderId.SEEDREAM]: 10,
  [AIProviderId.GEMINI]: 3,
};

/**
 * CostPolicy — 预算不足时自动降级模型
 */
export function applyCostPolicy(
  provider: AIProviderId,
  balance: number,
  taskCost: number
): { provider: AIProviderId; reason: string } {
  let current = provider;
  const reasons: string[] = [];

  if (balance < taskCost) {
    return {
      provider: AIProviderId.GEMINI,
      reason: `积分不足任务费用(${taskCost})，降级至 Gemini`,
    };
  }

  let idx = COST_DOWNGRADE_CHAIN.indexOf(current);
  if (idx < 0) idx = 0;

  while (idx < COST_DOWNGRADE_CHAIN.length - 1) {
    const threshold = PROVIDER_BALANCE_THRESHOLD[current];
    if (balance >= threshold && balance >= taskCost) break;

    const next = COST_DOWNGRADE_CHAIN[idx + 1];
    reasons.push(`${current}→${next}(余额${balance}<${threshold})`);
    current = next;
    idx++;
  }

  return {
    provider: current,
    reason: reasons.length ? `成本降级: ${reasons.join(", ")}` : "成本策略通过",
  };
}
