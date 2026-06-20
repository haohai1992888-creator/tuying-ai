import type { Request, Response } from "express";
import { getModelStats } from "../../analytics/model";

export async function modelStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await getModelStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "获取模型统计失败",
    });
  }
}
