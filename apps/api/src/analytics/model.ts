import { modelUsageService } from "@acs/router";
import { getModelCost } from "../config/models";

export async function logModelCall(input: {
  model: string;
  taskId: string;
  userId: string;
  taskType: string;
  success: boolean;
  durationMs: number;
}): Promise<void> {
  await modelUsageService.record({
    provider: input.model.toLowerCase(),
    taskType: input.taskType,
    taskId: input.taskId,
    userId: input.userId,
    success: input.success,
    duration: input.durationMs,
    cost: input.success ? getModelCost(input.model) : 0,
  });
}

export async function getModelStats() {
  const rows = await modelUsageService.getProviderStats();

  return rows.map((row) => ({
    model: row.provider,
    label: row.label,
    calls: row.callCount,
    cost: row.pointsCost,
    successRate: row.successRate,
    successCount: row.successCount,
    failureCount: row.failureCount,
    avgDurationMs: row.avgDurationMs,
  }));
}
