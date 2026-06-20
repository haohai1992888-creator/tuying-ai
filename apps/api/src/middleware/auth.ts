import type { Request, Response, NextFunction } from "express";
import { getBearerToken, verifyAccessToken } from "@acs/auth/crypto";

export function auth(req: Request, res: Response, next: NextFunction): void {
  const token = getBearerToken(req.headers.authorization ?? null);

  if (!token) {
    res.status(401).json({ message: "未登录" });
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ message: "Token无效" });
    return;
  }

  req.userId = payload.sub;
  req.userRole = payload.role;
  next();
}
