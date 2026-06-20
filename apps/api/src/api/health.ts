import type { Request, Response } from "express";
import { prisma } from "../db";
import { pingRedis, getQueueHealth } from "@acs/queue";
import { jsonSuccess } from "../utils/response";

export async function health(_req: Request, res: Response): Promise<void> {
  const started = Date.now();

  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }

  const redis = await pingRedis();
  const queue = await getQueueHealth();

  const healthy = db && redis;
  const payload = {
    status: healthy ? "ok" : "degraded",
    service: "acs-api",
    version: process.env.APP_VERSION ?? "1.0.0-rc",
    uptimeSec: Math.floor(process.uptime()),
    checks: { db, redis, queue },
    latencyMs: Date.now() - started,
  };

  if (healthy) {
    jsonSuccess(res, payload);
    return;
  }

  res.status(503).json({
    success: false,
    message: "Service unhealthy",
    code: "HEALTH_CHECK_FAILED",
    data: payload,
  });
}
