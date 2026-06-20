import { prisma } from "@acs/database";
import { AIProviderId } from "@acs/shared";

export interface ModelUsageRecordInput {
  provider: string;
  taskType: string;
  success: boolean;
  duration: number;
  taskId?: string;
  userId?: string;
  cost?: number;
}

export interface ProviderMonitorStats {
  provider: string;
  label: string;
  callCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgDurationMs: number;
  pointsCost: number;
}

const PROVIDER_LABELS: Record<string, string> = {
  [AIProviderId.GPT]: "GPT Image 2",
  [AIProviderId.SEEDREAM]: "Seedream",
  [AIProviderId.GEMINI]: "Gemini Flash Image",
};

export class ModelUsageService {
  async record(input: ModelUsageRecordInput): Promise<void> {
    await prisma.modelUsage.create({
      data: {
        provider: input.provider,
        taskType: input.taskType,
        taskId: input.taskId ?? null,
        userId: input.userId ?? null,
        success: input.success,
        duration: input.duration,
        cost: input.cost ?? 0,
      },
    });
  }

  async getProviderStats(limit = 5000): Promise<ProviderMonitorStats[]> {
    const rows = await prisma.modelUsage.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const byProvider = new Map<string, typeof rows>();
    for (const row of rows) {
      const key = row.provider.toLowerCase();
      if (!byProvider.has(key)) byProvider.set(key, []);
      byProvider.get(key)!.push(row);
    }

    const providers = [AIProviderId.GPT, AIProviderId.SEEDREAM, AIProviderId.GEMINI];

    return providers.map((provider) => {
      const list = byProvider.get(provider) ?? [];
      const successCount = list.filter((r) => r.success).length;
      const failureCount = list.length - successCount;
      const avgDurationMs =
        list.length > 0 ? Math.round(list.reduce((s, r) => s + r.duration, 0) / list.length) : 0;
      const pointsCost = list.filter((r) => r.success).reduce((s, r) => s + r.cost, 0);

      return {
        provider,
        label: PROVIDER_LABELS[provider] ?? provider,
        callCount: list.length,
        successCount,
        failureCount,
        successRate: list.length ? Math.round((successCount / list.length) * 1000) / 10 : 0,
        avgDurationMs,
        pointsCost,
      };
    });
  }
}

export const modelUsageService = new ModelUsageService();
