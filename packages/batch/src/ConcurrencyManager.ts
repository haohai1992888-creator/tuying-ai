import { UserPlan, resolveEffectivePlan } from "@acs/shared";

/** 并发控制 — FREE 3 / VIP 10 / ENTERPRISE 30 */
export class ConcurrencyManager {
  private readonly activeByUser = new Map<string, number>();

  getLimit(plan: UserPlan | string): number {
    const effective =
      typeof plan === "string" && Object.values(UserPlan).includes(plan as UserPlan)
        ? (plan as UserPlan)
        : UserPlan.FREE;
    switch (effective) {
      case UserPlan.ENTERPRISE:
        return 30;
      case UserPlan.VIP:
        return 10;
      default:
        return 3;
    }
  }

  getLimitForUser(input: { plan?: string | null; vipExpireAt?: Date | null; role?: string | null }): number {
    return this.getLimit(resolveEffectivePlan(input));
  }

  getActive(userId: string): number {
    return this.activeByUser.get(userId) ?? 0;
  }

  canAcquire(userId: string, plan: UserPlan | string): boolean {
    return this.getActive(userId) < this.getLimit(plan);
  }

  canAcquireForUser(userId: string, user: { plan?: string | null; vipExpireAt?: Date | null; role?: string | null }): boolean {
    return this.canAcquire(userId, resolveEffectivePlan(user));
  }

  acquire(userId: string): void {
    this.activeByUser.set(userId, this.getActive(userId) + 1);
  }

  release(userId: string): void {
    const next = Math.max(0, this.getActive(userId) - 1);
    if (next === 0) this.activeByUser.delete(userId);
    else this.activeByUser.set(userId, next);
  }

  remainingSlots(userId: string, plan: UserPlan | string): number {
    return Math.max(0, this.getLimit(plan) - this.getActive(userId));
  }

  remainingSlotsForUser(userId: string, user: { plan?: string | null; vipExpireAt?: Date | null; role?: string | null }): number {
    return this.remainingSlots(userId, resolveEffectivePlan(user));
  }
}

export const concurrencyManager = new ConcurrencyManager();
