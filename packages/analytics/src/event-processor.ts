import { prisma } from "@acs/database";
import {
  MODEL_UNIT_COST_USD,
  POINT_TO_REVENUE_CNY,
} from "@acs/shared";
import type { TrackEventInput } from "./types";

function startOfDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function toDecimal(n: number | undefined): number {
  return n ?? 0;
}

/** Event Processor — 写入事件并更新聚合统计 */
export class EventProcessor {
  async process(input: TrackEventInput): Promise<void> {
    const cost = input.cost ?? 0;
    const revenue = input.revenue ?? 0;
    const day = startOfDay();

    await prisma.analyticsEvent.create({
      data: {
        userId: input.userId ?? null,
        eventType: input.eventType,
        module: input.module,
        action: input.action,
        metadata: (input.metadata ?? {}) as object,
        cost: cost || null,
        revenue: revenue || null,
        duration: input.duration ?? null,
      },
    });

    if (input.userId) {
      await this.updateUserStats(input.userId, day, input);
    }

    await this.updateFeatureStats(input.module, day, cost, revenue);

    const model = extractModel(input);
    if (model) {
      await this.updateModelStats(model, day, input);
    }
  }

  private async updateUserStats(userId: string, day: Date, input: TrackEventInput): Promise<void> {
    const isGenerate = input.action === "generate" || input.eventType.includes("GENERATE");
    const generateInc = isGenerate ? 1 : 0;
    const cost = toDecimal(input.cost);
    const revenue = toDecimal(input.revenue);

    await prisma.userStats.upsert({
      where: { userId_date: { userId, date: day } },
      create: {
        userId,
        date: day,
        generateCount: generateInc,
        cost,
        revenue,
      },
      update: {
        generateCount: { increment: generateInc },
        cost: { increment: cost },
        revenue: { increment: revenue },
      },
    });
  }

  private async updateFeatureStats(
    module: string,
    day: Date,
    cost: number,
    revenue: number
  ): Promise<void> {
    await prisma.featureStats.upsert({
      where: { module_date: { module, date: day } },
      create: { module, date: day, usage: 1, cost, revenue },
      update: {
        usage: { increment: 1 },
        cost: { increment: cost },
        revenue: { increment: revenue },
      },
    });
  }

  private async updateModelStats(model: string, day: Date, input: TrackEventInput): Promise<void> {
    const isFail = input.eventType === "MODEL_FAIL" || input.action === "fail";
    const isSuccess = !isFail && (input.eventType === "MODEL_CALL" || input.action === "success");
    const cost = toDecimal(input.cost) || estimateModelCost(model);

    await prisma.modelStats.upsert({
      where: { model_date: { model, date: day } },
      create: {
        model,
        date: day,
        calls: 1,
        success: isSuccess ? 1 : 0,
        fail: isFail ? 1 : 0,
        cost,
      },
      update: {
        calls: { increment: 1 },
        success: { increment: isSuccess ? 1 : 0 },
        fail: { increment: isFail ? 1 : 0 },
        cost: { increment: cost },
      },
    });
  }
}

function extractModel(input: TrackEventInput): string | null {
  const meta = input.metadata ?? {};
  if (typeof meta.model === "string") return meta.model;
  if (typeof meta.provider === "string") return meta.provider;
  if (input.module === "model") return String(meta.model ?? "unknown");
  return null;
}

export function estimateModelCost(model: string): number {
  const key = model.toLowerCase();
  for (const [k, v] of Object.entries(MODEL_UNIT_COST_USD)) {
    if (key.includes(k)) return v;
  }
  return 0.02;
}

export function pointsToRevenue(points: number): number {
  return points * POINT_TO_REVENUE_CNY;
}

export const eventProcessor = new EventProcessor();
