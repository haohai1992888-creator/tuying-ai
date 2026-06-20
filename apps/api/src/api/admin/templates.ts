import type { Request, Response } from "express";
import { templateService } from "@acs/templates";
import { jsonSuccess, jsonFail } from "../../utils/response";
import { paramString } from "../../utils/params";

export async function listTemplates(_req: Request, res: Response): Promise<void> {
  try {
    const templates = await templateService.listAllAdmin();
    jsonSuccess(res, templates);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取模板列表失败", undefined, 500);
  }
}

export async function createTemplate(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    name?: string;
    description?: string;
    category?: string;
    coverUrl?: string;
    workflowId?: string;
    taskType?: string;
    promptName?: string;
    promptContent?: string;
    promptVariables?: string[];
    isVip?: boolean;
    enabled?: boolean;
    sortOrder?: number;
  };

  if (!body?.name || !body.category || !body.coverUrl || !body.promptContent) {
    jsonFail(res, "请填写必要字段");
    return;
  }

  try {
    const row = await templateService.createTemplate({
      name: body.name,
      description: body.description ?? "",
      category: body.category,
      coverUrl: body.coverUrl,
      workflowId: body.workflowId ?? "scene-image-workflow",
      taskType: body.taskType ?? "scene_image",
      promptName: body.promptName ?? body.name,
      promptContent: body.promptContent,
      promptVariables: body.promptVariables,
      isVip: body.isVip,
      enabled: body.enabled,
      sortOrder: body.sortOrder,
    });
    jsonSuccess(res, row);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "创建失败");
  }
}

export async function updateTemplate(req: Request, res: Response): Promise<void> {
  const id = paramString(req, "id");
  const body = req.body as {
    name?: string;
    description?: string;
    category?: string;
    coverUrl?: string;
    enabled?: boolean;
    isVip?: boolean;
    sortOrder?: number;
    promptContent?: string;
  };

  try {
    const row = await templateService.updateTemplate(id, body ?? {});
    jsonSuccess(res, row);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "更新失败");
  }
}

export async function templateStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await templateService.getStats();
    jsonSuccess(res, stats);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取模板统计失败", undefined, 500);
  }
}
