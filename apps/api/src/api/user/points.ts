import type { Request, Response } from "express";
import { listPointLogs } from "../../billing/pointService";

export async function logs(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const list = await listPointLogs(userId);
    res.json(list);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "获取消费记录失败",
    });
  }
}
