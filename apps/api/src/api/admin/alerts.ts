import type { Request, Response } from "express";
import { listAlerts, resolveAlert } from "@acs/analytics";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function getAlerts(_req: Request, res: Response): Promise<void> {
  try {
    const rows = await listAlerts();
    jsonSuccess(
      res,
      rows.map((a) => ({
        id: a.id,
        message: a.message,
        level: a.level,
        createdAt: a.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取预警失败", undefined, 500);
  }
}

export async function resolveAlertHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as { id?: string };
  if (!body.id) {
    jsonFail(res, "无效 ID", undefined, 400);
    return;
  }

  try {
    await resolveAlert(body.id);
    jsonSuccess(res, { success: true });
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "操作失败", undefined, 500);
  }
}
