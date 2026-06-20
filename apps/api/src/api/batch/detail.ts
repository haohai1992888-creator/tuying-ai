import type { Request, Response } from "express";
import { getBatchForUser } from "../../services/batchService";
import { toBatchResponse } from "../../utils/batch-response";

export async function detail(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "未登录" });
      return;
    }

    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      res.status(400).json({ message: "无效的 Batch ID" });
      return;
    }

    const batch = await getBatchForUser(id, userId);
    if (!batch) {
      res.status(404).json({ message: "批量任务不存在" });
      return;
    }

    res.json(toBatchResponse(batch));
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "获取批量任务失败",
    });
  }
}
