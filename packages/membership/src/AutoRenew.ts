import {
  PaymentMethod,
  PLAN_BENEFITS,
  PointType,
  REDIS_KEYS,
  REDIS_TTL,
  resolveEffectivePlan,
  SubscriptionOrderStatus,
  UserPlan,
  UserRole,
} from "@acs/shared";
import { cacheService } from "@acs/shared/redis";

/** 自动续费预留接口 — Phase 10 不实现扣费 */
export interface AutoRenew {
  enabled: boolean;
  userId: string;
  planId: string;
  nextRenewAt: string | null;
}

export interface AutoRenewService {
  getAutoRenew(userId: string): Promise<AutoRenew>;
  setAutoRenew(userId: string, enabled: boolean, planId?: string): Promise<AutoRenew>;
}

export class AutoRenewStub implements AutoRenewService {
  async getAutoRenew(userId: string): Promise<AutoRenew> {
    return { enabled: false, userId, planId: "", nextRenewAt: null };
  }

  async setAutoRenew(userId: string, enabled: boolean, planId?: string): Promise<AutoRenew> {
    return { enabled: false, userId, planId: planId ?? "", nextRenewAt: null };
  }
}

export const autoRenewService = new AutoRenewStub();
