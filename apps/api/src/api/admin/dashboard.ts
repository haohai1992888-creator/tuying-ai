import type { Request, Response } from "express";
import { analyticsService, evaluateAlerts, listAlerts } from "@acs/analytics";
import { betaService } from "@acs/beta";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function dashboard(_req: Request, res: Response): Promise<void> {
  try {
    await evaluateAlerts();
    const [dataCenter, alerts, betaStats] = await Promise.all([
      analyticsService.getDataCenterDashboard(),
      listAlerts(),
      betaService.getBetaDashboardStats(),
    ]);

    jsonSuccess(res, {
      dataCenter,
      betaStats,
      alerts: alerts.map((a) => ({
        id: a.id,
        message: a.message,
        level: a.level,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取 Dashboard 失败", undefined, 500);
  }
}