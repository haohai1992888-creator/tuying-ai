import type { Request, Response } from "express";
import { betaService } from "@acs/beta";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function getCostCenter(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await betaService.getCostCenter();
    jsonSuccess(res, stats);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取成本数据失败", undefined, 500);
  }
}

export async function getBehaviorStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await betaService.getBehaviorStats();
    jsonSuccess(res, stats);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取行为统计失败", undefined, 500);
  }
}
