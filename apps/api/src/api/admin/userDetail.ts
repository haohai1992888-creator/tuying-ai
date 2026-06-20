import type { Request, Response } from "express";
import { adminService } from "@acs/admin-service";
import { UserStatus } from "@acs/shared";
import type { UserRole } from "@acs/shared";
import { jsonSuccess, jsonFail } from "../../utils/response";
import { paramString } from "../../utils/params";

export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const id = paramString(req, "id");
    const user = await adminService.getUser(id);
    if (!user) {
      jsonFail(res, "用户不存在", undefined, 404);
      return;
    }
    jsonSuccess(res, user);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "获取用户失败", undefined, 500);
  }
}

export async function patchUser(req: Request, res: Response): Promise<void> {
  const id = paramString(req, "id");
  const body = req.body as {
    status?: UserStatus;
    pointsDelta?: number;
    role?: string;
    vipExpireAt?: string | null;
  };

  if (!body || Object.keys(body).length === 0) {
    jsonFail(res, "无效请求体");
    return;
  }

  try {
    if (body.status) {
      await adminService.updateUserStatus(id, body.status);
    }
    if (body.pointsDelta !== undefined) {
      await adminService.adjustPoints(id, body.pointsDelta);
    }
    if (body.role || body.vipExpireAt !== undefined) {
      await adminService.updateVip(id, {
        role: body.role as UserRole | undefined,
        vipExpireAt: body.vipExpireAt,
      });
    }

    const user = await adminService.getUser(id);
    jsonSuccess(res, user);
  } catch (error) {
    jsonFail(res, error instanceof Error ? error.message : "更新失败");
  }
}
