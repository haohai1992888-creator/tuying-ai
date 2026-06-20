import type { Request, Response } from "express";
import { videoService } from "@acs/video";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function listVideoTasks(_req: Request, res: Response): Promise<void> {
  try {
    const tasks = await videoService.listAllAdmin();
    jsonSuccess(res, tasks);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取视频任务失败", undefined, 500);
  }
}
