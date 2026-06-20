import type { Request, Response } from "express";
import { taskService } from "@acs/tasks";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function listTasks(req: Request, res: Response): Promise<void> {
  try {
    const limit = Number(req.query.limit ?? "100");
    const tasks = await taskService.listAllTasks(limit);
    jsonSuccess(res, tasks);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取任务列表失败", undefined, 500);
  }
}

export async function listAiTasks(req: Request, res: Response): Promise<void> {
  try {
    const limit = Number(req.query.limit ?? "100");
    const tasks = await taskService.listAiTasks(limit);
    jsonSuccess(res, tasks);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取 AI 任务失败", undefined, 500);
  }
}
