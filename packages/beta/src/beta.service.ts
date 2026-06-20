import { prisma } from "@acs/database";
import { AnalyticsTracker } from "@acs/analytics";
import { pointService } from "@acs/points";
import { PointType, REDIS_KEYS } from "@acs/shared";
import { cacheService } from "@acs/shared/redis";
import type {
  AnnouncementDto,
  BetaDashboardStats,
  BetaReport,
  BetaUserDto,
  BehaviorStats,
  CostCenterStats,
  FeedbackDto,
  InviteCodeDto,
} from "./types";

const GIFT_AMOUNTS = [100, 500, 1000] as const;
export type GiftAmount = (typeof GIFT_AMOUNTS)[number];

function userLabel(user: {
  nickname: string | null;
  email: string | null;
  phone: string | null;
  id: string;
}): string {
  return user.nickname?.trim() || user.email?.trim() || user.phone?.trim() || user.id.slice(0, 8);
}

function mapBetaUser(user: {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string | null;
  points: number;
  betaPoints: number;
  betaUser: boolean;
  betaExpireAt: Date | null;
  status: string;
  createdAt: Date;
}): BetaUserDto {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    nickname: user.nickname,
    points: user.points,
    betaPoints: user.betaPoints,
    betaUser: user.betaUser,
    betaExpireAt: user.betaExpireAt?.toISOString() ?? null,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };
}

function startOfDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysAgo(n: number): Date {
  const d = startOfDay();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

export class BetaService {
  async listBetaUsers(limit = 50): Promise<BetaUserDto[]> {
    const rows = await prisma.user.findMany({
      where: { betaUser: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(mapBetaUser);
  }

  async addBetaUser(input: {
    userId?: string;
    email?: string;
    expireDays?: number;
  }): Promise<BetaUserDto> {
    const user = await this.resolveUser(input.userId, input.email);
    const days = input.expireDays ?? 30;
    const betaExpireAt = new Date(Date.now() + days * 86400000);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { betaUser: true, betaExpireAt },
    });
    await cacheService.del(REDIS_KEYS.user(user.id));
    return mapBetaUser(updated);
  }

  async removeBetaUser(userId: string): Promise<BetaUserDto> {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { betaUser: false, betaExpireAt: null },
    });
    await cacheService.del(REDIS_KEYS.user(userId));
    return mapBetaUser(updated);
  }

  async extendBeta(userId: string, days: number): Promise<BetaUserDto> {
    if (days <= 0) throw new Error("延长天数必须大于 0");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("用户不存在");
    if (!user.betaUser) throw new Error("非内测用户");

    const base = user.betaExpireAt && user.betaExpireAt.getTime() > Date.now()
      ? user.betaExpireAt.getTime()
      : Date.now();
    const betaExpireAt = new Date(base + days * 86400000);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { betaExpireAt, betaUser: true },
    });
    await cacheService.del(REDIS_KEYS.user(userId));
    return mapBetaUser(updated);
  }

  async giftPoints(userId: string, amount: GiftAmount): Promise<{ balance: number; betaPoints: number }> {
    if (!GIFT_AMOUNTS.includes(amount)) {
      throw new Error("赠送积分仅支持 100 / 500 / 1000");
    }

    const result = await pointService.addPoints(
      userId,
      amount,
      PointType.GIFT,
      `内测赠送 ${amount} 积分`
    );

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { betaPoints: { increment: amount } },
    });
    await cacheService.del(REDIS_KEYS.user(userId));

    return { balance: result.balance, betaPoints: updated.betaPoints };
  }

  async listInviteCodes(): Promise<InviteCodeDto[]> {
    const rows = await prisma.inviteCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        usages: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { id: true, email: true, phone: true, nickname: true } } },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      maxCount: row.maxCount,
      usedCount: row.usedCount,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      usages: row.usages.map((u) => ({
        id: u.id,
        userId: u.userId,
        userLabel: userLabel(u.user),
        createdAt: u.createdAt.toISOString(),
      })),
    }));
  }

  async createInviteCode(input: {
    code: string;
    maxCount: number;
    expiresAt?: string | null;
  }): Promise<InviteCodeDto> {
    const code = input.code.trim().toUpperCase();
    if (!code) throw new Error("邀请码不能为空");
    if (input.maxCount <= 0) throw new Error("次数限制必须大于 0");

    const row = await prisma.inviteCode.create({
      data: {
        code,
        maxCount: input.maxCount,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });

    return {
      id: row.id,
      code: row.code,
      maxCount: row.maxCount,
      usedCount: row.usedCount,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async deleteInviteCode(id: string): Promise<void> {
    await prisma.inviteCode.delete({ where: { id } });
  }

  async redeemInviteCode(userId: string, code: string): Promise<BetaUserDto> {
    const normalized = code.trim().toUpperCase();
    const invite = await prisma.inviteCode.findUnique({ where: { code: normalized } });
    if (!invite) throw new Error("邀请码无效");
    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      throw new Error("邀请码已过期");
    }
    if (invite.usedCount >= invite.maxCount) throw new Error("邀请码已达使用上限");

    const existing = await prisma.inviteCodeUsage.findFirst({
      where: { inviteCodeId: invite.id, userId },
    });
    if (existing) throw new Error("您已使用过该邀请码");

    const betaExpireAt = new Date(Date.now() + 30 * 86400000);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.inviteCodeUsage.create({
        data: { inviteCodeId: invite.id, userId },
      });
      await tx.inviteCode.update({
        where: { id: invite.id },
        data: { usedCount: { increment: 1 } },
      });
      return tx.user.update({
        where: { id: userId },
        data: { betaUser: true, betaExpireAt },
      });
    });

    await cacheService.del(REDIS_KEYS.user(userId));
    return mapBetaUser(updated);
  }

  async submitFeedback(input: {
    userId: string;
    category: "BUG" | "SUGGESTION" | "MODEL_ISSUE" | "FEATURE_REQUEST";
    content: string;
    taskId?: string;
    model?: string;
    error?: string;
    prompt?: string;
  }): Promise<FeedbackDto> {
    if (!input.content.trim()) throw new Error("反馈内容不能为空");

    const row = await prisma.feedback.create({
      data: {
        userId: input.userId,
        category: input.category,
        content: input.content.trim(),
        taskId: input.taskId,
        model: input.model,
        error: input.error,
        prompt: input.prompt,
      },
      include: { user: { select: { id: true, email: true, phone: true, nickname: true } } },
    });

    return this.mapFeedback(row);
  }

  async listFeedback(limit = 50, status?: string): Promise<FeedbackDto[]> {
    const rows = await prisma.feedback.findMany({
      where: status ? { status: status as "OPEN" | "REPLIED" | "CLOSED" } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { id: true, email: true, phone: true, nickname: true } } },
    });
    return rows.map((row) => this.mapFeedback(row));
  }

  async replyFeedback(id: string, adminReply: string): Promise<FeedbackDto> {
    if (!adminReply.trim()) throw new Error("回复内容不能为空");
    const row = await prisma.feedback.update({
      where: { id },
      data: { adminReply: adminReply.trim(), status: "REPLIED" },
      include: { user: { select: { id: true, email: true, phone: true, nickname: true } } },
    });
    return this.mapFeedback(row);
  }

  async closeFeedback(id: string): Promise<FeedbackDto> {
    const row = await prisma.feedback.update({
      where: { id },
      data: { status: "CLOSED" },
      include: { user: { select: { id: true, email: true, phone: true, nickname: true } } },
    });
    return this.mapFeedback(row);
  }

  async listAnnouncements(activeOnly = false): Promise<AnnouncementDto[]> {
    const now = new Date();
    const rows = await prisma.announcement.findMany({
      where: activeOnly
        ? { enabled: true, startAt: { lte: now }, endAt: { gte: now } }
        : undefined,
      orderBy: { startAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      enabled: row.enabled,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createAnnouncement(input: {
    title: string;
    content: string;
    startAt: string;
    endAt: string;
  }): Promise<AnnouncementDto> {
    const row = await prisma.announcement.create({
      data: {
        title: input.title.trim(),
        content: input.content.trim(),
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
      },
    });
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      enabled: row.enabled,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async updateAnnouncement(
    id: string,
    input: Partial<{ title: string; content: string; startAt: string; endAt: string; enabled: boolean }>
  ): Promise<AnnouncementDto> {
    const row = await prisma.announcement.update({
      where: { id },
      data: {
        title: input.title?.trim(),
        content: input.content?.trim(),
        startAt: input.startAt ? new Date(input.startAt) : undefined,
        endAt: input.endAt ? new Date(input.endAt) : undefined,
        enabled: input.enabled,
      },
    });
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      enabled: row.enabled,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await prisma.announcement.delete({ where: { id } });
  }

  trackBehavior(input: {
    userId: string;
    action: "PAGE_VIEW" | "TEMPLATE_CLICK" | "IMAGE_GENERATE" | "IMAGE_EXPORT";
    module: string;
    metadata?: Record<string, unknown>;
  }): void {
    AnalyticsTracker.track({
      userId: input.userId,
      eventType: `BEHAVIOR_${input.action}`,
      module: input.module,
      action: input.action.toLowerCase(),
      metadata: input.metadata,
    });
  }

  async getBehaviorStats(days = 30): Promise<BehaviorStats> {
    const since = daysAgo(days);
    const events = await prisma.analyticsEvent.findMany({
      where: {
        createdAt: { gte: since },
        eventType: { startsWith: "BEHAVIOR_" },
      },
      select: { module: true, action: true },
    });

    const counts = new Map<string, number>();
    for (const e of events) {
      const key = `${e.module}:${e.action}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const topFeatures = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => {
        const [module, action] = key.split(":");
        return { module, action, count };
      });

    return { topFeatures };
  }

  async getBetaDashboardStats(): Promise<BetaDashboardStats> {
    const weekAgo = daysAgo(7);
    const today = startOfDay();

    const [betaUserCount, betaUsers, tasks, modelStats, failedTasks, totalTasks] = await Promise.all([
      prisma.user.count({ where: { betaUser: true } }),
      prisma.user.findMany({
        where: { betaUser: true },
        select: { id: true },
      }),
      prisma.task.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.modelStats.findMany({ where: { date: { gte: daysAgo(7) } } }),
      prisma.task.count({ where: { createdAt: { gte: weekAgo }, status: "FAILED" } }),
      prisma.task.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);

    const betaIds = new Set(betaUsers.map((u) => u.id));
    const activeEvents = await prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: weekAgo }, userId: { in: [...betaIds] } },
      select: { userId: true },
      distinct: ["userId"],
    });

    const costByModel = new Map<string, number>();
    let totalCost = 0;
    for (const m of modelStats) {
      const cost = Number(m.cost);
      totalCost += cost;
      costByModel.set(m.model, (costByModel.get(m.model) ?? 0) + cost);
    }

    const modelShare = [...costByModel.entries()].map(([model, cost]) => ({
      model,
      cost: Math.round(cost * 10000) / 10000,
      percent: totalCost > 0 ? Math.round((cost / totalCost) * 100) : 0,
    }));

    const todayStats = await prisma.userStats.aggregate({
      where: { date: { gte: today } },
      _sum: { generateCount: true, cost: true },
      _count: true,
    });

    const generateCount = todayStats._sum.generateCount ?? tasks;
    const avgCost =
      (todayStats._count ?? 0) > 0
        ? Number(todayStats._sum.cost ?? 0) / (todayStats._count ?? 1)
        : totalCost > 0 && modelStats.length > 0
          ? totalCost / modelStats.reduce((s, m) => s + m.calls, 0)
          : 0;

    return {
      betaUserCount,
      activeBetaUsers: activeEvents.length,
      generateCount,
      avgCost: Math.round(avgCost * 10000) / 10000,
      modelShare,
      failureRate: totalTasks > 0 ? Math.round((failedTasks / totalTasks) * 100) : 0,
    };
  }

  async getCostCenter(): Promise<CostCenterStats> {
    const monthAgo = daysAgo(30);
    const [modelStats, userStats] = await Promise.all([
      prisma.modelStats.findMany({ where: { date: { gte: monthAgo } } }),
      prisma.userStats.findMany({
        where: { date: { gte: monthAgo } },
        include: { user: { select: { email: true, phone: true, nickname: true, id: true } } },
      }),
    ]);

    let gptCost = 0;
    let seedreamCost = 0;
    let geminiCost = 0;

    for (const m of modelStats) {
      const cost = Number(m.cost);
      const name = m.model.toLowerCase();
      if (name.includes("gpt")) gptCost += cost;
      else if (name.includes("seedream")) seedreamCost += cost;
      else if (name.includes("gemini")) geminiCost += cost;
    }

    const userCostMap = new Map<string, { cost: number; generateCount: number; label: string }>();
    for (const u of userStats) {
      const prev = userCostMap.get(u.userId) ?? {
        cost: 0,
        generateCount: 0,
        label: userLabel(u.user),
      };
      prev.cost += Number(u.cost);
      prev.generateCount += u.generateCount;
      userCostMap.set(u.userId, prev);
    }

    const userRanking = [...userCostMap.entries()]
      .map(([userId, v]) => ({
        userId,
        userLabel: v.label,
        cost: Math.round(v.cost * 10000) / 10000,
        generateCount: v.generateCount,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 20);

    const totalCost = gptCost + seedreamCost + geminiCost;

    return {
      gptCost: Math.round(gptCost * 10000) / 10000,
      seedreamCost: Math.round(seedreamCost * 10000) / 10000,
      geminiCost: Math.round(geminiCost * 10000) / 10000,
      totalCost: Math.round(totalCost * 10000) / 10000,
      userRanking,
    };
  }

  async generateBetaReport(): Promise<BetaReport> {
    const monthAgo = daysAgo(30);
    const weekAgo = daysAgo(7);

    const [
      userCount,
      betaUserCount,
      activeBeta,
      paidOrders,
      feedbackGroups,
      templates,
      behavior,
      costCenter,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { betaUser: true } }),
      prisma.analyticsEvent.findMany({
        where: {
          createdAt: { gte: weekAgo },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.order.count({
        where: { status: "PAID", createdAt: { gte: monthAgo } },
      }),
      prisma.feedback.groupBy({
        by: ["category"],
        _count: { category: true },
        orderBy: { _count: { category: "desc" } },
      }),
      prisma.template.findMany({
        orderBy: { usageCount: "desc" },
        take: 10,
        select: { name: true, usageCount: true },
      }),
      this.getBehaviorStats(30),
      this.getCostCenter(),
    ]);

    const betaActive = await prisma.user.count({
      where: {
        betaUser: true,
        analyticsEvents: { some: { createdAt: { gte: weekAgo } } },
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      userCount,
      betaUserCount,
      activeRate: betaUserCount > 0 ? Math.round((betaActive / betaUserCount) * 100) : 0,
      paymentIntentRate: betaUserCount > 0 ? Math.round((paidOrders / betaUserCount) * 100) : 0,
      modelCost: {
        gpt: costCenter.gptCost,
        seedream: costCenter.seedreamCost,
        gemini: costCenter.geminiCost,
        total: costCenter.totalCost,
      },
      topIssues: feedbackGroups.map((g) => ({
        category: g.category,
        count: g._count.category,
      })),
      topTemplates: templates.map((t) => ({
        name: t.name,
        usageCount: t.usageCount,
      })),
      topFeatures: behavior.topFeatures.map((f) => ({
        label: `${f.module}/${f.action}`,
        count: f.count,
      })),
    };
  }

  private async resolveUser(userId?: string, email?: string) {
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("用户不存在");
      return user;
    }
    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error("用户不存在");
      return user;
    }
    throw new Error("请提供 userId 或 email");
  }

  private mapFeedback(row: {
    id: string;
    userId: string;
    category: string;
    content: string;
    status: string;
    adminReply: string | null;
    taskId: string | null;
    model: string | null;
    error: string | null;
    prompt: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: { id: string; email: string | null; phone: string | null; nickname: string | null };
  }): FeedbackDto {
    return {
      id: row.id,
      userId: row.userId,
      userLabel: userLabel(row.user),
      category: row.category,
      content: row.content,
      status: row.status,
      adminReply: row.adminReply,
      taskId: row.taskId,
      model: row.model,
      error: row.error,
      prompt: row.prompt,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

export const betaService = new BetaService();
export { GIFT_AMOUNTS };
