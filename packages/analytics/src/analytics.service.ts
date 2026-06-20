import { prisma } from "@acs/database";
import { eventProcessor, estimateModelCost, pointsToRevenue } from "./event-processor";
import type { TrackEventInput, UserDataSummary, DataCenterDashboard } from "./types";

function startOfDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysAgo(n: number): Date {
  const d = startOfDay();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

/** AnalyticsTracker — 统一埋点入口 */
export class AnalyticsTracker {
  static track(input: TrackEventInput): void {
    void analyticsService.track(input);
  }
}

export class AnalyticsService {
  async track(input: TrackEventInput): Promise<void> {
    try {
      await eventProcessor.process(input);
    } catch (error) {
      console.error("[Analytics] track failed:", error);
    }
  }

  async getUserSummary(userId: string, remainingPoints: number): Promise<UserDataSummary> {
    const today = startOfDay();
    const [stats, events, modelRows] = await Promise.all([
      prisma.userStats.findUnique({ where: { userId_date: { userId, date: today } } }),
      prisma.analyticsEvent.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.modelStats.findMany({
        where: { date: today },
        orderBy: { calls: "desc" },
        take: 5,
      }),
    ]);

    return {
      todayGenerateCount: stats?.generateCount ?? 0,
      todayCost: Number(stats?.cost ?? 0),
      todayRevenue: Number(stats?.revenue ?? 0),
      remainingPoints,
      recentEvents: events.map((e) => ({
        eventType: e.eventType,
        module: e.module,
        action: e.action,
        createdAt: e.createdAt.toISOString(),
      })),
      modelUsage: modelRows.map((m) => ({
        model: m.model,
        calls: m.calls,
        successRate: m.calls > 0 ? Math.round((m.success / m.calls) * 100) : 0,
      })),
    };
  }

  async getDataCenterDashboard(): Promise<DataCenterDashboard> {
    const today = startOfDay();
    const weekAgo = daysAgo(7);
    const monthAgo = daysAgo(30);

    const [
      todayEvents,
      todayFeatureStats,
      todayModelStats,
      weekUsers,
      monthUsers,
      allFeatureStats,
      topUserStats,
      templates,
      templateUsages,
    ] = await Promise.all([
      prisma.analyticsEvent.findMany({ where: { createdAt: { gte: today } } }),
      prisma.featureStats.findMany({ where: { date: today } }),
      prisma.modelStats.findMany({ where: { date: today } }),
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: weekAgo }, userId: { not: null } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: monthAgo }, userId: { not: null } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.featureStats.findMany({ where: { date: { gte: daysAgo(30) } } }),
      prisma.userStats.findMany({
        where: { date: today },
        orderBy: { revenue: "desc" },
        take: 10,
        include: { user: { select: { email: true, phone: true, nickname: true } } },
      }),
      prisma.template.findMany({ select: { id: true, name: true, usageCount: true } }),
      prisma.templateUsage.count(),
    ]);

    const todayRevenue = todayEvents.reduce((s, e) => s + Number(e.revenue ?? 0), 0);
    const todayCost = todayEvents.reduce((s, e) => s + Number(e.cost ?? 0), 0);
    const todayGenerateCount = todayEvents.filter((e) =>
      e.eventType.includes("GENERATE")
    ).length;
    const todayActiveUsers = new Set(todayEvents.map((e) => e.userId).filter(Boolean)).size;

    const totalRevenueAgg = await prisma.analyticsEvent.aggregate({
      _sum: { revenue: true },
    });
    const totalRevenue = Number(totalRevenueAgg._sum.revenue ?? 0);
    const userCount = await prisma.user.count();
    const arpu = userCount > 0 ? totalRevenue / userCount : 0;

    const features: DataCenterDashboard["features"] = todayFeatureStats.map((f) => ({
      module: f.module,
      usage: f.usage,
      revenue: Number(f.revenue),
      cost: Number(f.cost),
      profit: Number(f.revenue) - Number(f.cost),
    }));

    const models: DataCenterDashboard["models"] = todayModelStats.map((m) => ({
      model: m.model,
      calls: m.calls,
      success: m.success,
      fail: m.fail,
      successRate: m.calls > 0 ? Math.round((m.success / m.calls) * 100) : 0,
      cost: Number(m.cost),
    }));

    const topUsers: DataCenterDashboard["topUsers"] = topUserStats.map((u) => {
      const label =
        u.user.nickname?.trim() ||
        u.user.email?.trim() ||
        u.user.phone?.trim() ||
        u.userId.slice(0, 8);
      return {
        userId: u.userId,
        userLabel: label,
        generateCount: u.generateCount,
        revenue: Number(u.revenue),
        cost: Number(u.cost),
        profit: Number(u.revenue) - Number(u.cost),
      };
    });

    const templateHot: DataCenterDashboard["templateHot"] = templates
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map((t) => ({
        templateId: t.id,
        name: t.name,
        usageCount: t.usageCount,
        conversionRate:
          templateUsages > 0 ? Math.round((t.usageCount / templateUsages) * 100) : 0,
      }));

    const featureProfitMap = new Map<string, number>();
    for (const f of allFeatureStats) {
      const profit = Number(f.revenue) - Number(f.cost);
      featureProfitMap.set(f.module, (featureProfitMap.get(f.module) ?? 0) + profit);
    }
    const mostProfitableFeature =
      [...featureProfitMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

    const mostExpensiveModel =
      [...models].sort((a, b) => b.cost - a.cost)[0]?.model ?? "-";
    const highestValueUser = topUsers[0]?.userLabel ?? "-";

    const videoFeature = features.find((f) => f.module === "video");
    const batchFeature = features.find((f) => f.module === "batch");

    return {
      overview: {
        todayRevenue,
        todayCost,
        todayProfit: todayRevenue - todayCost,
        todayActiveUsers,
        todayGenerateCount,
        dau: todayActiveUsers,
        wau: weekUsers.length,
        mau: monthUsers.length,
        totalRevenue,
        arpu: Math.round(arpu * 100) / 100,
      },
      features,
      models,
      topUsers,
      templateHot,
      insights: {
        mostProfitableFeature,
        mostExpensiveModel,
        highestValueUser,
        videoProfitable: videoFeature ? videoFeature.profit >= 0 : true,
        batchProfitable: batchFeature ? batchFeature.profit >= 0 : true,
      },
    };
  }
}

export const analyticsService = new AnalyticsService();

/** 便捷：积分消耗埋点 */
export function trackPointsDeduct(input: {
  userId: string;
  amount: number;
  module: string;
  remark?: string;
  metadata?: Record<string, unknown>;
}): void {
  AnalyticsTracker.track({
    userId: input.userId,
    eventType: "POINTS_DEDUCT",
    module: input.module,
    action: "deduct",
    revenue: pointsToRevenue(input.amount),
    cost: estimateModelCost(String(input.metadata?.provider ?? "gpt")),
    metadata: { amount: input.amount, remark: input.remark, ...input.metadata },
  });
}

/** 便捷：模型调用埋点 */
export function trackModelCall(input: {
  userId?: string;
  provider: string;
  success: boolean;
  duration: number;
  module?: string;
  taskType?: string;
  fallback?: boolean;
}): void {
  AnalyticsTracker.track({
    userId: input.userId,
    eventType: input.fallback
      ? "MODEL_FALLBACK"
      : input.success
        ? "MODEL_CALL"
        : "MODEL_FAIL",
    module: input.module ?? "model",
    action: input.success ? "success" : "fail",
    duration: input.duration,
    cost: estimateModelCost(input.provider),
    metadata: {
      provider: input.provider,
      taskType: input.taskType,
    },
  });
}
