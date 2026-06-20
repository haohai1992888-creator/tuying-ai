import { prisma } from "@acs/database";
import { pointService } from "@acs/points";
import { getPaymentProvider } from "@acs/payment";
import {
  PaymentMethod,
  PLAN_BENEFITS,
  PointType,
  REDIS_KEYS,
  resolveEffectivePlan,
  SubscriptionOrderStatus,
  UserPlan,
  UserRole,
} from "@acs/shared";
import { cacheService } from "@acs/shared/redis";
import { Decimal } from "@prisma/client/runtime/library";
import { randomBytes } from "node:crypto";
import type { AutoRenewService } from "./AutoRenew";
import { autoRenewService } from "./AutoRenew";

export interface MembershipDto {
  userId: string;
  plan: UserPlan;
  effectivePlan: UserPlan;
  vipExpireAt: string | null;
  points: number;
  benefits: (typeof PLAN_BENEFITS)[UserPlan];
  autoRenew: boolean;
}

export interface SubscriptionPlanDto {
  id: string;
  name: string;
  planCode: UserPlan;
  price: number;
  points: number;
  duration: number;
  enabled: boolean;
}

export interface SubscriptionOrderDto {
  id: string;
  orderNo: string;
  planCode: string;
  amount: number;
  status: SubscriptionOrderStatus;
  expireAt: string;
  paidAt: string | null;
  payUrl?: string;
}

export interface MembershipStats {
  totalUsers: number;
  freeCount: number;
  vipCount: number;
  enterpriseCount: number;
  activeMembers: number;
  renewalRate: number;
  revenue: number;
  conversionRate: number;
}

function apiBase(): string {
  return process.env.API_PUBLIC_URL ?? "http://localhost:3000";
}

function generateOrderNo(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `SUB${ts}${rand}`;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export class MembershipService {
  constructor(private readonly renewService: AutoRenewService = autoRenewService) {}

  async getMembership(userId: string): Promise<MembershipDto | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, plan: true, vipExpireAt: true, points: true, role: true },
    });
    if (!user) return null;

    const effectivePlan = resolveEffectivePlan(user);
    const renew = await this.renewService.getAutoRenew(userId);

    return {
      userId: user.id,
      plan: user.plan as UserPlan,
      effectivePlan,
      vipExpireAt: user.vipExpireAt?.toISOString() ?? null,
      points: user.points,
      benefits: PLAN_BENEFITS[effectivePlan],
      autoRenew: renew.enabled,
    };
  }

  async listPlans(): Promise<SubscriptionPlanDto[]> {
    const rows = await prisma.subscriptionPlan.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      planCode: row.planCode as UserPlan,
      price: Number(row.price),
      points: row.points,
      duration: row.duration,
      enabled: row.enabled,
    }));
  }

  async createSubscriptionOrder(input: {
    userId: string;
    planId: string;
    paymentMethod: PaymentMethod;
  }): Promise<SubscriptionOrderDto> {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: input.planId } });
    if (!plan || !plan.enabled) throw new Error("会员套餐不存在或已下架");

    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) throw new Error("用户不存在");

    const orderNo = generateOrderNo();
    const now = new Date();
    const baseExpire =
      user.vipExpireAt && user.vipExpireAt > now ? user.vipExpireAt : now;
    const expireAt = new Date(baseExpire.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    const order = await prisma.subscriptionOrder.create({
      data: {
        userId: input.userId,
        planId: plan.id,
        planCode: plan.planCode,
        orderNo,
        amount: new Decimal(plan.price),
        status: SubscriptionOrderStatus.PENDING,
        paymentMethod: input.paymentMethod,
        expireAt,
      },
    });

    const isMock = (process.env.PAYMENT_MODE ?? "mock").toLowerCase() === "mock";
    let payUrl = "";
    if (isMock) {
      payUrl = `${apiBase()}/api/membership/mock-pay?orderNo=${orderNo}`;
    } else {
      const provider = getPaymentProvider(input.paymentMethod);
      const payment = await provider.createOrder({
        orderNo,
        userId: input.userId,
        amount: Number(plan.price),
        points: plan.points,
        subject: `${plan.name} 会员订阅`,
        notifyUrl: `${apiBase()}/api/membership/callback/${input.paymentMethod === PaymentMethod.WECHAT ? "wechat" : "alipay"}`,
      });
      payUrl = payment.payUrl ?? "";
    }

    return {
      id: order.id,
      orderNo: order.orderNo,
      planCode: order.planCode,
      amount: Number(order.amount),
      status: order.status as SubscriptionOrderStatus,
      expireAt: order.expireAt.toISOString(),
      paidAt: null,
      payUrl,
    };
  }

  async renewMembership(userId: string, planId: string, paymentMethod: PaymentMethod) {
    return this.createSubscriptionOrder({ userId, planId, paymentMethod });
  }

  async upgradeMembership(userId: string, planId: string, paymentMethod: PaymentMethod) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error("会员套餐不存在");
    if (plan.planCode !== UserPlan.ENTERPRISE) {
      throw new Error("升级仅支持企业版套餐");
    }
    return this.createSubscriptionOrder({ userId, planId, paymentMethod });
  }

  async fulfillSubscription(input: {
    orderNo: string;
    externalTradeNo: string;
  }): Promise<SubscriptionOrderDto> {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.subscriptionOrder.findUnique({
        where: { orderNo: input.orderNo },
        include: { plan: true },
      });
      if (!order) throw new Error("订阅订单不存在");

      if (order.status === SubscriptionOrderStatus.PAID) {
        return { order, alreadyPaid: true };
      }
      if (order.status !== SubscriptionOrderStatus.PENDING) {
        throw new Error(`订单状态不可支付: ${order.status}`);
      }

      await tx.subscriptionOrder.update({
        where: { id: order.id },
        data: {
          status: SubscriptionOrderStatus.PAID,
          paidAt: new Date(),
          externalTradeNo: input.externalTradeNo,
        },
      });

      const user = await tx.user.findUnique({ where: { id: order.userId } });
      if (!user) throw new Error("用户不存在");

      const newPlan = order.planCode as UserPlan;
      const role =
        newPlan === UserPlan.VIP && user.role === UserRole.USER ? UserRole.VIP : user.role;

      const updatedUser = await tx.user.update({
        where: { id: order.userId },
        data: {
          plan: newPlan,
          role,
          vipExpireAt: order.expireAt,
          points: { increment: order.plan.points },
        },
      });

      await tx.pointLog.create({
        data: {
          userId: order.userId,
          type: PointType.GIFT,
          amount: order.plan.points,
          balance: updatedUser.points,
          remark: `会员开通 ${order.plan.name}`,
        },
      });

      const paid = await tx.subscriptionOrder.findUniqueOrThrow({
        where: { id: order.id },
      });
      return { order: paid, alreadyPaid: false };
    });

    await cacheService.del(REDIS_KEYS.user(result.order.userId));
    await cacheService.del(REDIS_KEYS.points(result.order.userId));

    return {
      id: result.order.id,
      orderNo: result.order.orderNo,
      planCode: result.order.planCode,
      amount: Number(result.order.amount),
      status: result.order.status as SubscriptionOrderStatus,
      expireAt: result.order.expireAt.toISOString(),
      paidAt: result.order.paidAt?.toISOString() ?? null,
    };
  }

  async dailyCheckIn(userId: string): Promise<{ points: number; balance: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, vipExpireAt: true, role: true },
    });
    if (!user) throw new Error("用户不存在");

    const effectivePlan = resolveEffectivePlan(user);
    const amount = PLAN_BENEFITS[effectivePlan].dailySignInPoints;
    const cacheKey = REDIS_KEYS.dailyCheckIn(userId, todayKey());
    const checked = await cacheService.get(cacheKey);
    if (checked) throw new Error("今日已签到");

    const result = await pointService.addPoints(userId, amount, PointType.SIGN_IN, "每日签到");
    await cacheService.set(cacheKey, "1", 86400);
    return { points: amount, balance: result.balance };
  }

  async adminGrantMembership(input: {
    userId: string;
    plan: UserPlan;
    days: number;
    grantPoints?: boolean;
  }): Promise<MembershipDto> {
    if (input.plan === UserPlan.FREE) throw new Error("请使用取消会员接口");

    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) throw new Error("用户不存在");

    const now = new Date();
    const base =
      user.vipExpireAt && user.vipExpireAt > now ? user.vipExpireAt : now;
    const vipExpireAt = new Date(base.getTime() + input.days * 24 * 60 * 60 * 1000);
    const bonusPoints = input.grantPoints !== false ? PLAN_BENEFITS[input.plan].giftPoints : 0;

    await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: input.userId },
        data: {
          plan: input.plan,
          vipExpireAt,
          role: input.plan === UserPlan.VIP && user.role === UserRole.USER ? UserRole.VIP : user.role,
          points: bonusPoints > 0 ? { increment: bonusPoints } : undefined,
        },
      });

      if (bonusPoints > 0) {
        await tx.pointLog.create({
          data: {
            userId: input.userId,
            type: PointType.GIFT,
            amount: bonusPoints,
            balance: updated.points,
            remark: `管理员赠送 ${input.plan} 会员`,
          },
        });
      }
    });

    await cacheService.del(REDIS_KEYS.user(input.userId));
    await cacheService.del(REDIS_KEYS.points(input.userId));

    const membership = await this.getMembership(input.userId);
    if (!membership) throw new Error("用户不存在");
    return membership;
  }

  async adminExtendMembership(userId: string, days: number): Promise<MembershipDto> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("用户不存在");
    if (resolveEffectivePlan(user) === UserPlan.FREE) throw new Error("用户当前无有效会员");

    const now = new Date();
    const base = user.vipExpireAt && user.vipExpireAt > now ? user.vipExpireAt : now;
    await prisma.user.update({
      where: { id: userId },
      data: { vipExpireAt: new Date(base.getTime() + days * 24 * 60 * 60 * 1000) },
    });
    await cacheService.del(REDIS_KEYS.user(userId));

    const membership = await this.getMembership(userId);
    if (!membership) throw new Error("用户不存在");
    return membership;
  }

  async adminCancelMembership(userId: string): Promise<MembershipDto> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: UserPlan.FREE,
        vipExpireAt: null,
        role: UserRole.USER,
      },
    });
    await cacheService.del(REDIS_KEYS.user(userId));

    const membership = await this.getMembership(userId);
    if (!membership) throw new Error("用户不存在");
    return membership;
  }

  async listMembers(limit = 50): Promise<Array<MembershipDto & { userLabel?: string }>> {
    const rows = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        email: true,
        phone: true,
        nickname: true,
        plan: true,
        vipExpireAt: true,
        points: true,
        role: true,
      },
    });

    return Promise.all(
      rows.map(async (row) => {
        const effectivePlan = resolveEffectivePlan(row);
        const renew = await this.renewService.getAutoRenew(row.id);
        return {
          userId: row.id,
          plan: row.plan as UserPlan,
          effectivePlan,
          vipExpireAt: row.vipExpireAt?.toISOString() ?? null,
          points: row.points,
          benefits: PLAN_BENEFITS[effectivePlan],
          autoRenew: renew.enabled,
          userLabel:
            row.nickname?.trim() ||
            row.email?.trim() ||
            row.phone?.trim() ||
            row.id.slice(0, 8),
        };
      })
    );
  }

  async getStats(): Promise<MembershipStats> {
    const [totalUsers, users, paidOrders, renewCandidates] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({ select: { plan: true, vipExpireAt: true, role: true } }),
      prisma.subscriptionOrder.findMany({
        where: { status: SubscriptionOrderStatus.PAID },
        select: { amount: true, userId: true, createdAt: true },
      }),
      prisma.subscriptionOrder.findMany({
        where: { status: SubscriptionOrderStatus.PAID },
        select: { userId: true },
      }),
    ]);

    let freeCount = 0;
    let vipCount = 0;
    let enterpriseCount = 0;
    for (const user of users) {
      const plan = resolveEffectivePlan(user);
      if (plan === UserPlan.ENTERPRISE) enterpriseCount += 1;
      else if (plan === UserPlan.VIP) vipCount += 1;
      else freeCount += 1;
    }

    const activeMembers = vipCount + enterpriseCount;
    const revenue = paidOrders.reduce((sum, o) => sum + Number(o.amount), 0);
    const uniquePaidUsers = new Set(paidOrders.map((o) => o.userId)).size;
    const renewalRate =
      renewCandidates.length > 0
        ? Math.round((paidOrders.length / renewCandidates.length) * 100)
        : 0;
    const conversionRate =
      totalUsers > 0 ? Math.round((uniquePaidUsers / totalUsers) * 100) : 0;

    return {
      totalUsers,
      freeCount,
      vipCount,
      enterpriseCount,
      activeMembers,
      renewalRate,
      revenue,
      conversionRate,
    };
  }
}

export const membershipService = new MembershipService();
