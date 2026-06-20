import type { Request, Response } from "express";
import { batchService } from "@acs/batch";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function listBatchTasks(req: Request, res: Response): Promise<void> {
  try {
    const limit = Number(req.query.limit ?? "50");
    const batches = await batchService.listAllBatches(limit);
    jsonSuccess(res, batches);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取批量任务失败", undefined, 500);
  }
}
