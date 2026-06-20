import type { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import crypto from "node:crypto";
import { logger } from "@acs/ops";

export const globalRateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "请求过于频繁，请稍后再试" },
});

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const started = Date.now();
  res.on("finish", () => {
    logger.info("HTTP", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - started,
    });
  });
  next();
}

/**
 * Optional API signature: headers x-timestamp, x-nonce, x-signature
 * signature = HMAC-SHA256(`${timestamp}.${nonce}.${body}`, API_SIGN_SECRET)
 */
export function apiSignature(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.API_SIGN_SECRET;
  if (!secret) {
    next();
    return;
  }

  const timestamp = req.header("x-timestamp");
  const nonce = req.header("x-nonce");
  const signature = req.header("x-signature");

  if (!timestamp || !nonce || !signature) {
    res.status(401).json({ message: "缺少签名头" });
    return;
  }

  const skew = Math.abs(Date.now() - Number(timestamp));
  if (Number.isNaN(Number(timestamp)) || skew > 5 * 60_000) {
    res.status(401).json({ message: "签名已过期" });
    return;
  }

  const body =
    typeof req.body === "string" ? req.body : req.body ? JSON.stringify(req.body) : "";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${nonce}.${body}`)
    .digest("hex");

  if (expected !== signature) {
    res.status(401).json({ message: "签名无效" });
    return;
  }

  next();
}
