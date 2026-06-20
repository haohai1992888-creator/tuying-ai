import type { Request, Response } from "express";
import { modelUsageService } from "@acs/router";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function getModelUsage(req: Request, res: Response): Promise<void> {
  try {
    const limit = Number(req.query.limit ?? "5000");
    const stats = await modelUsageService.getProviderStats(limit);
    jsonSuccess(res, stats);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取模型用量失败", undefined, 500);
  }
}
