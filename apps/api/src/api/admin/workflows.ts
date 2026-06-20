import type { Request, Response } from "express";
import { workflowAdminService } from "@acs/workflow";
import { jsonSuccess, jsonFail } from "../../utils/response";
import { paramString } from "../../utils/params";

export async function listWorkflowRuns(req: Request, res: Response): Promise<void> {
  try {
    const limit = Number(req.query.limit ?? "100");
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const runs = await workflowAdminService.listRuns(limit, status);
    jsonSuccess(res, runs);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取工作流运行失败", undefined, 500);
  }
}

export async function retryWorkflowRun(req: Request, res: Response): Promise<void> {
  const id = paramString(req, "id");

  try {
    const result = await workflowAdminService.retryRun(id);
    jsonSuccess(res, result);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "重试失败");
  }
}

export async function listWorkflows(_req: Request, res: Response): Promise<void> {
  try {
    jsonSuccess(res, workflowAdminService.listWorkflows());
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取工作流失败", undefined, 500);
  }
}
