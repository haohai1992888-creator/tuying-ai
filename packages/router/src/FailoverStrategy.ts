import { AIProviderId } from "@acs/shared";

/** 故障转移链 */
export const FAILOVER_CHAINS: Record<AIProviderId, AIProviderId[]> = {
  [AIProviderId.GPT]: [AIProviderId.GPT, AIProviderId.SEEDREAM, AIProviderId.GEMINI],
  [AIProviderId.SEEDREAM]: [AIProviderId.SEEDREAM, AIProviderId.GEMINI, AIProviderId.GPT],
  [AIProviderId.GEMINI]: [AIProviderId.GEMINI, AIProviderId.SEEDREAM, AIProviderId.GPT],
};

export function getFailoverChain(primary: AIProviderId): AIProviderId[] {
  return FAILOVER_CHAINS[primary] ?? [primary, AIProviderId.GEMINI];
}
