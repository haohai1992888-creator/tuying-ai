import type { Request, Response, NextFunction } from "express";
import { getBearerToken, verifyAccessToken } from "@acs/auth/crypto";
import { UserRole } from "@acs/shared";
import { jsonFail } from "../utils/response";

export function admin(req: Request, res: Response, next: NextFunction): void {
  const token = getBearerToken(req.headers.authorization ?? null);

  if (!token) {
    jsonFail(res, "未登录", "UNAUTHORIZED", 401);
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    jsonFail(res, "Token无效", "INVALID_TOKEN", 401);
    return;
  }

  if (payload.role !== UserRole.ADMIN) {
    jsonFail(res, "需要管理员权限", "FORBIDDEN", 403);
    return;
  }

  req.userId = payload.sub;
  req.userRole = payload.role;
  next();
}
