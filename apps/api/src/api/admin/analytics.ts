import type { Request, Response } from "express";
import { analyticsService } from "@acs/analytics";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function getAnalytics(_req: Request, res: Response): Promise<void> {
  try {
    const dashboard = await analyticsService.getDataCenterDashboard();
    jsonSuccess(res, dashboard);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取分析数据失败", undefined, 500);
  }
}
