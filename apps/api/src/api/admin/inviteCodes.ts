import type { Request, Response } from "express";
import { betaService } from "@acs/beta";
import { jsonSuccess, jsonFail } from "../../utils/response";

export async function listInviteCodes(_req: Request, res: Response): Promise<void> {
  try {
    const codes = await betaService.listInviteCodes();
    jsonSuccess(res, codes);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取邀请码失败", undefined, 500);
  }
}

export async function createInviteCode(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as { code?: string; maxCount?: number; expiresAt?: string | null };
    if (!body.code || !body.maxCount) {
      jsonFail(res, "请提供 code 和 maxCount");
      return;
    }
    const code = await betaService.createInviteCode({
      code: body.code,
      maxCount: body.maxCount,
      expiresAt: body.expiresAt,
    });
    jsonSuccess(res, code);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "创建邀请码失败");
  }
}

export async function deleteInviteCode(req: Request, res: Response): Promise<void> {
  try {
    await betaService.deleteInviteCode(req.params.id as string);
    jsonSuccess(res, { ok: true });
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "删除邀请码失败");
  }
}
