import type { Request, Response } from "express";
import { betaService } from "@acs/beta";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function listFeedback(req: Request, res: Response): Promise<void> {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const items = await betaService.listFeedback(100, status);
    jsonSuccess(res, items);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取反馈失败", undefined, 500);
  }
}

export async function replyFeedback(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const adminReply = (req.body as { adminReply?: string }).adminReply ?? "";
    const item = await betaService.replyFeedback(id, adminReply);
    jsonSuccess(res, item);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "回复失败");
  }
}

export async function closeFeedback(req: Request, res: Response): Promise<void> {
  try {
    const item = await betaService.closeFeedback(req.params.id as string);
    jsonSuccess(res, item);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "关闭失败");
  }
}
