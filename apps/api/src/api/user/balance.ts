import type { Request, Response } from "express";
import { getBalance } from "../../billing/pointService";

export async function balance(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const points = await getBalance(userId);
    res.json({ balance: points });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "获取余额失败",
    });
  }
}
