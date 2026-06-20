import {
  COST_MONITOR_THRESHOLD_USD,
  MODEL_UNIT_COST_USD,
} from "@acs/shared";

export interface CostCheckResult {
  allowed: boolean;
  shouldFallback: boolean;
  reason: string;
  suggestedProvider?: string;
}

/** Cost Monitor — 成本过高时触发降级建议 */
export class CostMonitor {
  private readonly threshold: number;

  constructor(threshold = COST_MONITOR_THRESHOLD_USD) {
    this.threshold = threshold;
  }

  check(costUsd: number, context?: { provider?: string; userBalance?: number }): CostCheckResult {
    if (costUsd <= this.threshold) {
      return { allowed: true, shouldFallback: false, reason: "成本在阈值内" };
    }

    const chain = ["gpt", "seedream", "gemini"];
    const current = context?.provider?.toLowerCase() ?? "gpt";
    const idx = chain.indexOf(current);
    const next = idx >= 0 && idx < chain.length - 1 ? chain[idx + 1] : "gemini";

    return {
      allowed: true,
      shouldFallback: true,
      reason: `单次成本 $${costUsd.toFixed(3)} 超过阈值 $${this.threshold}，建议降级`,
      suggestedProvider: next,
    };
  }

  estimateProviderCost(provider: string): number {
    return MODEL_UNIT_COST_USD[provider.toLowerCase()] ?? 0.02;
  }
}

export const costMonitor = new CostMonitor();
