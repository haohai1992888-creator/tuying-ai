import type { Request, Response } from "express";
import { betaService } from "@acs/beta";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function listAnnouncements(_req: Request, res: Response): Promise<void> {
  try {
    const items = await betaService.listAnnouncements(false);
    jsonSuccess(res, items);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取公告失败", undefined, 500);
  }
}

export async function createAnnouncement(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as { title?: string; content?: string; startAt?: string; endAt?: string };
    if (!body.title || !body.content || !body.startAt || !body.endAt) {
      jsonFail(res, "请填写完整公告信息");
      return;
    }
    const item = await betaService.createAnnouncement({
      title: body.title,
      content: body.content,
      startAt: body.startAt,
      endAt: body.endAt,
    });
    jsonSuccess(res, item);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "创建公告失败");
  }
}

export async function updateAnnouncement(req: Request, res: Response): Promise<void> {
  try {
    const item = await betaService.updateAnnouncement(req.params.id as string, req.body as Record<string, unknown>);
    jsonSuccess(res, item);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "更新公告失败");
  }
}

export async function deleteAnnouncement(req: Request, res: Response): Promise<void> {
  try {
    await betaService.deleteAnnouncement(req.params.id as string);
    jsonSuccess(res, { ok: true });
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "删除公告失败");
  }
}
